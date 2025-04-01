import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function Market({ contract, account, web3,theme }) {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    attackPower: false,
    abilityPower: false,
    armorPenetration: false,
    lifeSteal: false,
    attackSpeed: false,
    healthPoints: false,
    armor: false,
    magicResist: false,
    mana: false,
    manaRegeneration: false,
    movementSpeed: false,
    healingShielding: false,
  });
  const [selectedType, setSelectedType] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rentalDays, setRentalDays] = useState("1");
  const [viewMode, setViewMode] = useState("preview");
  const { t } = useTranslation();

  const attributeNames = t("attribute_names", { returnObjects: true });
  const equipmentTypes = t("equipment_types", { returnObjects: true });

  const loadItems = async () => {
    if (!contract || !web3) return;
    try {
      const listedItems = await contract.methods.getListedItems().call();
      const itemsData = await Promise.all(
        listedItems.map(async (id) => {
          const equipment = await contract.methods.getEquipment(id).call();
          const listing = await contract.methods.listings(id).call();
          return {
            id,
            name: equipment.name,
            attributes: equipment.attributes,
            listing,
            type: equipment.eqType,
            image: `/images/${equipmentTypes[equipment.eqType].name}.png`,
          };
        })
      );
      setItems(itemsData);
    } catch (error) {
      console.error("加载市场失败:", error);
    }
  };

  useEffect(() => {
    loadItems();
  }, [contract, web3]);

  useEffect(() => {
    if (selectedItem && selectedItem.listing.forRent) {
      setRentalDays(selectedItem.listing.minRentalDays.toString());
    }
  }, [selectedItem]);

  const handleBuy = async (item) => {
    try {
      await contract.methods.buyItem(item.id).send({ from: account, value: item.listing.salePrice.toString() });
      alert(t("buy_success"));
      loadItems();
    } catch (error) {
      alert(t("buy_failed", { message: error.message }));
    }
  };

  const handleRent = async (item, days) => {
    try {
      const rentalPricePerDay = web3.utils.toBN(item.listing.rentalPricePerDay);
      const totalRentalPrice = rentalPricePerDay.mul(web3.utils.toBN(days));
      await contract.methods.rentItem(item.id, days).send({
        from: account,
        value: totalRentalPrice.toString()
      });
      alert(t("rent_success"));
      loadItems();
    } catch (error) {
      alert(t("rent_failed", { message: error.message }));
    }
  };

  const handleFilterChange = (attr) => {
    setFilters((prev) => ({ ...prev, [attr]: !prev[attr] }));
  };

  const filteredItems = items.filter((item) => {
    if (selectedType !== null && Number(item.type) !== selectedType) return false;
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const attrIndex = Object.keys(attributeNames).indexOf(key);
      return item.attributes[attrIndex] > 0n;
    });
  });
  const attributeLabels = [
    attributeNames.attackPower,
    attributeNames.abilityPower,
    attributeNames.armorPenetration,
    attributeNames.lifeSteal,
    attributeNames.attackSpeed,
    attributeNames.healthPoints,
    attributeNames.armor,
    attributeNames.magicResist,
    attributeNames.mana,
    attributeNames.manaRegeneration,
    attributeNames.movementSpeed,
    attributeNames.healingShielding,
  ];
  const nonZeroAttributes = (attrs) => {
    const attrArray = Array.isArray(attrs) ? attrs : Object.values(attrs);
    return attrArray
      .map((value, index) => {
        if (Number(value) > 0 && attributeLabels[index]) {
          return `${attributeLabels[index]}: ${value}`;
        }
        return null;
      })
      .filter(Boolean);
  };

  return (
    <div className={`app-container theme-${theme}`}>
    <div className="market">
      <div className="sidebar">
        <h3>{t("filter_attributes")}</h3>
        {Object.entries(attributeNames).map(([key, label]) => (
          <label key={key}>
            <input type="checkbox" checked={filters[key]} onChange={() => handleFilterChange(key)} />
            {label}
          </label>
        ))}
      </div>
      <div className="main-content">
        <div className="type-selector">
          {equipmentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={selectedType === type.id ? "active" : ""}
            >
              <img src={type.icon} alt={type.name} />
              {type.name}
            </button>
          ))}
        </div>
        <button onClick={() => setViewMode(viewMode === "preview" ? "list" : "preview")}>
          {t(viewMode === "preview" ? "switch_to_list" : "switch_to_preview")}
        </button>
        {!selectedItem ? (
          <div className="item-list">
            {filteredItems.map((item) => (
              <div key={item.id} className="item" onClick={() => setSelectedItem(item)}>
                <img src={item.image} alt={item.name} />
                <p>{item.name}</p>
                {viewMode === "list" && <p>{nonZeroAttributes(item.attributes).join(", ")}</p>}
                {viewMode === "preview" && (
                  <p>
                    {item.listing.forSale && `${t("for_sale")}: ${web3.utils.fromWei(item.listing.salePrice, "ether")} ETH`}
                    {item.listing.forRent && `${t("for_rent")}: ${web3.utils.fromWei(item.listing.rentalPricePerDay, "ether")} ETH/day`}
                  </p>
                )}
                {hoveredItem === item && viewMode === "preview" && (
                  <div className="hover-details">
                    {nonZeroAttributes(item.attributes).map((attr, idx) => (
                      <p key={idx}>{attr}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="item-detail">
            <h2>{selectedItem.name}</h2>
            <img src={selectedItem.image} alt={selectedItem.name} />
            <p>{t("type")}: {equipmentTypes[selectedItem.type].name}</p>
            <p>{t("attributes")}: {nonZeroAttributes(selectedItem.attributes).join(", ")}</p>
            {selectedItem.listing.forSale && (
              <div>
                <h3>{t("buy")}</h3>
                <p>
                  {t("price")}: {web3.utils.fromWei(selectedItem.listing.salePrice.toString(), "ether")} ETH
                </p>
                <button onClick={() => handleBuy(selectedItem)}>{t("confirm_buy")}</button>
              </div>
            )}
            {selectedItem.listing.forRent && (
              <div>
                <h3>{t("rent")}</h3>
                <p>
                  {t("daily_rent")}: {web3.utils.fromWei(selectedItem.listing.rentalPricePerDay.toString(), "ether")} ETH
                </p>
                <p>{t("min_rental_days")}: {Number(selectedItem.listing.minRentalDays)}</p>
                <label>
                  {t("rental_days")}:
                  <input
                    type="number"
                    min={Number(selectedItem.listing.minRentalDays)}
                    value={rentalDays}
                    onChange={(e) => setRentalDays(e.target.value)}
                  />
                </label>
                <p>
                  {t("total_rent")}:{" "}
                  {(Number(rentalDays) * Number(web3.utils.fromWei(selectedItem.listing.rentalPricePerDay.toString(), "ether"))).toFixed(4)} ETH
                </p>
                <button onClick={() => handleRent(selectedItem, Number(rentalDays))}>{t("confirm_rent")}</button>
              </div>
            )}
            <button onClick={() => setSelectedItem(null)}>{t("back")}</button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default Market;