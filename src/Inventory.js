import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fromWei, toWei } from './utils';

// 设备类型到图片前缀的映射
const typeToPrefix = {
  0: 'wu', // 武器
  1: 'yi', // 上身
  2: 'ku', // 裤子
  3: 'xie', // 鞋子
  4: 'tou' // 头盔
};

function Inventory({ contract, account, web3, theme }) {
  const [activeTab, setActiveTab] = useState("mint");
  const [userItems, setUserItems] = useState({ unlisted: [], listed: [] });
  const [listingItem, setListingItem] = useState(null);
  const [listingOptions, setListingOptions] = useState({
    forSale: false,
    salePrice: "",
    forRent: false,
    rentalPricePerDay: "",
    minRentalDays: "",
  });
  const [equipmentType, setEquipmentType] = useState(0);
  const [equipmentName, setEquipmentName] = useState("");
  const [attributes, setAttributes] = useState(Array(12).fill(0));
  const [totalValue, setTotalValue] = useState("0");
  const [selectedStyle, setSelectedStyle] = useState(1); // 默认样式为 1
  const { t } = useTranslation();

  const attributeLabels = t("attribute_labels", { returnObjects: true });
  const equipmentTypes = t("equipment_types", { returnObjects: true });

  const calculateTotalValueLocal = (attributes) => {
    const coefficients = [35n, 22n, 25n, 20n, 40n, 15n, 30n, 30n, 10n, 12n, 50n, 18n];
    let total = 0n;
    attributes.forEach((attr, index) => {
      total += BigInt(attr) * coefficients[index];
    });
    return total;
  };

  const handleAttributeChange = (index, value) => {
    const newAttributes = [...attributes];
    newAttributes[index] = parseInt(value) || 0;
    setAttributes(newAttributes);
    const totalValueWei = calculateTotalValueLocal(newAttributes);
    setTotalValue(fromWei(totalValueWei));
  };

  const handleMint = async () => {
    if (!contract || !equipmentName) {
      alert(t("mint_error_missing_data"));
      return;
    }
    try {
      const valueInWei = calculateTotalValueLocal(attributes);
      // 将所选样式传递给智能合约
      const tx = await contract.methods
        .mintEquipment(equipmentType, attributes.map(attr => attr.toString()), equipmentName, selectedStyle)
        .send({ from: account, value: valueInWei.toString() });
      alert(t("mint_success"));
      loadUserItems();
    } catch (error) {
      console.error("Minting failed:", error);
      alert(t("mint_failed", { message: error.message }));
    }
  };

  const loadUserItems = async () => {
    if (!contract || !account) return;
    try {
      const totalItems = await contract.methods.totalSupply().call();
      const userItems = [];
      for (let i = 1; i <= totalItems; i++) {
        const owner = await contract.methods.ownerOf(i).call();
        if (owner.toLowerCase() === account.toLowerCase()) {
          const equipment = await contract.methods.getEquipment(i).call();
          const listing = await contract.methods.listings(i).call();
          const currentUser = await contract.methods.userOf(i).call();
          const expiresAt = await contract.methods.userExpires(i).call();
          // 根据设备类型和样式ID构造默认图片路径
          const image = `/images/${typeToPrefix[equipment.eqType]}${equipment.styleId}.png`;
          userItems.push({
            id: i,
            name: equipment.name,
            type: equipment.eqType,
            attributes: equipment.attributes,
            image,
            listing,
            currentUser,
            expiresAt,
          });
        }
      }
      setUserItems({
        unlisted: userItems.filter((item) => !item.listing.forSale && !item.listing.forRent),
        listed: userItems.filter((item) => item.listing.forSale || item.listing.forRent),
      });
    } catch (error) {
      console.error("Loading user items failed:", error);
    }
  };

  useEffect(() => {
    loadUserItems();
  }, [contract, account]);

  const handleListClick = (item) => {
    setListingItem(item);
    setListingOptions({ forSale: false, salePrice: "", forRent: false, rentalPricePerDay: "", minRentalDays: "" });
  };

  const handleList = async () => {
    if (!listingItem) return;
    const { forSale, salePrice, forRent, rentalPricePerDay, minRentalDays } = listingOptions;
    if ((forSale && !salePrice) || (forRent && (!rentalPricePerDay || !minRentalDays))) {
      alert(t("list_error_missing_fields"));
      return;
    }
    try {
      const salePriceWei = forSale ? toWei(salePrice) : BigInt(0);
      const rentalPriceWei = forRent ? toWei(rentalPricePerDay) : BigInt(0);
      await contract.methods
        .listItem(listingItem.id, forSale, salePriceWei.toString(), forRent, rentalPriceWei.toString(), minRentalDays)
        .send({ from: account });
      alert(t("list_success"));
      setListingItem(null);
      loadUserItems();
    } catch (error) {
      alert(t("list_failed", { message: error.message }));
    }
  };

  const handleDelist = async (tokenId) => {
    try {
      await contract.methods.delistItem(tokenId).send({ from: account });
      alert(t("delist_success"));
      loadUserItems();
    } catch (error) {
      alert(t("delist_failed", { message: error.message }));
    }
  };

  const nonZeroAttributes = (attrs) => {
    const attrArray = Array.isArray(attrs) ? attrs : Object.values(attrs);
    return attrArray
      .map((value, index) => {
        if (BigInt(value) > 0n && attributeLabels[index]) {
          return `${attributeLabels[index]}: ${value}`;
        }
        return null;
      })
      .filter(Boolean);
  };

  return (
    <div className={`app-container theme-${theme}`}>
      <div className="inventory">
        <div className="inventory-tabs">
          <button className={`tab ${activeTab === "mint" ? "active" : ""}`} onClick={() => setActiveTab("mint")}>
            {t("mint_equipment")}
          </button>
          <button className={`tab ${activeTab === "unlisted" ? "active" : ""}`} onClick={() => setActiveTab("unlisted")}>
            {t("unlisted_items")}
          </button>
          <button className={`tab ${activeTab === "listed" ? "active" : ""}`} onClick={() => setActiveTab("listed")}>
            {t("listed_items")}
          </button>
        </div>
        <div className="tab-content">
          {activeTab === "mint" && (
            <div className="mint-section">
              <h2>{t("mint_equipment")}</h2>
              <label>
                {t("equipment_type")}:
                <select value={equipmentType} onChange={(e) => setEquipmentType(parseInt(e.target.value))}>
                  {equipmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("name")}:
                <input
                  type="text"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  placeholder={t("enter_equipment_name")}
                />
              </label>
              <label>
                {t("style")}:
                <select value={selectedStyle} onChange={(e) => setSelectedStyle(parseInt(e.target.value))}>
                  <option value={1}> 1</option>
                  <option value={2}> 2</option>
                  <option value={3}> 3</option>
                  <option value={4}> 4</option>
                  <option value={5}> 5</option>
                </select>
              </label>
              {equipmentType !== null && selectedStyle && (
                <div>
                  <h4>{t("preview")}</h4>
                  <img
                    src={`/images/${typeToPrefix[equipmentType]}${selectedStyle}.png`}
                    alt="预览"
                    style={{ width: '100px', height: '100px' }}
                  />
                </div>
              )}
              <h3>{t("attributes")}</h3>
              {attributeLabels.map((label, index) => (
                <label key={index}>
                  {label}:
                  <input
                    type="number"
                    min="0"
                    value={attributes[index]}
                    onChange={(e) => handleAttributeChange(index, e.target.value)}
                  />
                </label>
              ))}
              <p>{t("mint_cost")}: {totalValue} ETH</p>
              <button onClick={handleMint}>{t("mint")}</button>
            </div>
          )}
          {activeTab === "unlisted" && (
            <div className="item-list">
              {userItems.unlisted.length === 0 ? (
                <p className="no-items">{t("no_items_listed")}</p>
              ) : (
                userItems.unlisted.map((item) => (
                  <div key={item.id} className="item">
                    <img src={item.image} alt={item.name} />
                    <p>{t("name")}: {item.name}</p>
                    <p>{t("type")}: {equipmentTypes[item.type].name}</p>
                    <p>{t("attributes")}: {nonZeroAttributes(item.attributes).join(", ")}</p>
                    <button onClick={() => handleListClick(item)}>{t("list")}</button>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === "listed" && (
            <div className="item-list">
              {userItems.listed.length === 0 ? (
                <p className="no-items">{t("no_items_listed")}</p>
              ) : (
                userItems.listed.map((item) => (
                  <div key={item.id} className="item">
                    <img src={item.image} alt={item.name} />
                    <p>{t("name")}: {item.name}</p>
                    <p>{t("type")}: {equipmentTypes[item.type].name}</p>
                    {item.listing.forSale && (
                      <p>{t("for_sale")}: {fromWei(item.listing.salePrice)} ETH</p>
                    )}
                    {item.listing.forRent && (
                      <p>
                        {t("for_rent")}: {fromWei(item.listing.rentalPricePerDay)} ETH/天,
                        最小 {item.listing.minRentalDays} {t("days")}
                      </p>
                    )}
                    <button onClick={() => handleDelist(item.id)}>{t("delist")}</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {listingItem && (
          <div className="listing-form">
            <h3>{t("list_item")}: {listingItem.name}</h3>
            <label>
              <input
                type="checkbox"
                checked={listingOptions.forSale}
                onChange={(e) => setListingOptions({ ...listingOptions, forSale: e.target.checked })}
              />
              {t("list_for_sale")}
            </label>
            {listingOptions.forSale && (
              <label>
                {t("sale_price")} (ETH):
                <input
                  type="number"
                  value={listingOptions.salePrice}
                  onChange={(e) => setListingOptions({ ...listingOptions, salePrice: e.target.value })}
                  step="0.001"
                  min="0"
                />
              </label>
            )}
            <label>
              <input
                type="checkbox"
                checked={listingOptions.forRent}
                onChange={(e) => setListingOptions({ ...listingOptions, forRent: e.target.checked })}
              />
              {t("list_for_rent")}
            </label>
            {listingOptions.forRent && (
              <>
                <label>
                  {t("rental_price_per_day")} (ETH):
                  <input
                    type="number"
                    value={listingOptions.rentalPricePerDay}
                    onChange={(e) => setListingOptions({ ...listingOptions, rentalPricePerDay: e.target.value })}
                    step="0.001"
                    min="0"
                  />
                </label>
                <label>
                  {t("min_rental_days")}:
                  <input
                    type="number"
                    value={listingOptions.minRentalDays}
                    onChange={(e) => setListingOptions({ ...listingOptions, minRentalDays: e.target.value })}
                    min="1"
                  />
                </label>
              </>
            )}
            <button onClick={handleList}>{t("list")}</button>
            <button onClick={() => setListingItem(null)}>{t("cancel")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;