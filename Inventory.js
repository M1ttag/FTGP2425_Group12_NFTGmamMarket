import React, { useState, useEffect } from "react";

function Inventory({ contract, account, web3 }) {
    const contractAddress="0x4dcb75c5b4e2231b2476f59e4e61b1c9d4e6ee18";
    const [showMint, setShowMint] = useState(false);
    const [userItems, setUserItems] = useState({
        unlisted: [],
        listed: [],
    });
    const [listingItem, setListingItem] = useState(null);
    const [listingPrice, setListingPrice] = useState(0);
    const [equipmentType, setEquipmentType] = useState(0);
    const [equipmentName, setEquipmentName] = useState("");
    const [attributes, setAttributes] = useState(Array(12).fill(0));
    const [totalValue, setTotalValue] = useState("0");

    const attributeNames = [
        "Gongji Li",
        "Fashu Qiangdu",
        "Jiaju Poji",
        "Xueshi",
        "Gongji SuDu",
        "Shengming",
        "Jiaju",
        "Mofa Kangju",
        "Fali",
        "Fali Huifu",
        "Yidong SuDu",
        "Zhiliao Yu Dunpai",
    ];

    const equipmentTypes = [
        { id: 0, name: "Weapon" },
        { id: 1, name: "Upper Body" },
        { id: 2, name: "Pants" },
        { id: 3, name: "Shoes" },
        { id: 4, name: "Helmet" },
    ];

    const calculateTotalValueLocal = (attributes) => {
        const coefficients = [35, 22, 25, 20, 40, 15, 30, 30, 10, 12, 50, 18];
        let total = 0;
        attributes.forEach((attr, index) => {
            total += attr * coefficients[index];
        });
        return total;
    };

    const handleAttributeChange = (index, value) => {
        const newAttributes = [...attributes];
        newAttributes[index] = parseInt(value) || 0;
        setAttributes(newAttributes);
        const totalValueWei = calculateTotalValueLocal(newAttributes);
        setTotalValue(web3.utils.fromWei(totalValueWei.toString(), "ether"));
    };

    const handleMint = async () => {
        if (!contract) {
            alert("Contract not initialized. Please check network connection or contract configuration.");
            return;
        }
        if (!equipmentName) {
            alert("Please enter equipment name");
            return;
        }
        if (attributes.length !== 12) {
            alert("Attributes must be an array of 12 numbers");
            return;
        }
        try {
            const valueInWei = calculateTotalValueLocal(attributes);
            console.log("Minting with value:", valueInWei, "attributes:", attributes);
            const receipt = await contract.methods
                .mintEquipment(equipmentType, attributes, equipmentName)
                .send({ from: account, value: valueInWei.toString() });
            console.log("Transaction receipt:", receipt);
            alert("Minted successfully");
            setShowMint(false);
            loadUserItems();
        } catch (error) {
            console.error("Minting failed:", error);
            if (error.code === 4001) {
                alert("User rejected the transaction");
            } else if (error.message.includes("insufficient funds")) {
                alert("Insufficient balance to pay minting cost");
            } else {
                alert("Minting failed: " + error.message);
            }
        }
    };

    const loadUserItems = async () => {
        if (!contract || !account) return;
        try {
          console.log("Loading user items...");
        console.log("Contract address:", contractAddress);
        console.log("Account:", account);
        console.log("Network ID:", await web3.eth.net.getId());
            const totalItems = await contract.methods.totalSupply().call();
            console.log("Total supply:", totalItems);
            const unlisted = [];
            const listed = [];
            for (let i = 1; i <= totalItems; i++) {
                try {
                    const owner = await contract.methods.ownerOf(i).call();
                    console.log(`Token ID ${i} owner:`, owner);
                    if (owner.toLowerCase() === account.toLowerCase()) {
                        const equipment = await contract.methods.getEquipment(i).call();
                        const listing = await contract.methods.listings(i).call();
                        const item = {
                            id: i,
                            name: equipment.name,
                            type: equipment.eqType,
                            attributes: [
                                equipment.attributes.attackPower,
                                equipment.attributes.abilityPower,
                                equipment.attributes.armorPenetration,
                                equipment.attributes.lifeSteal,
                                equipment.attributes.attackSpeed,
                                equipment.attributes.healthPoints,
                                equipment.attributes.armor,
                                equipment.attributes.magicResist,
                                equipment.attributes.mana,
                                equipment.attributes.manaRegeneration,
                                equipment.attributes.movementSpeed,
                                equipment.attributes.healingShielding,
                            ],
                            price: listing.price,
                        };
                        if (listing.price > 0) {
                            listed.push(item);
                        } else {
                            unlisted.push(item);
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching item ${i}:`, error);
                }
            }
            setUserItems({ unlisted, listed });
            console.log("User items:", userItems);
        } catch (error) {
            console.error("Loading user items failed:", error);
        }
    };

    const handleList = async () => {
        if (!listingItem || listingPrice <= 0) return;
        try {
            const priceInWei = web3.utils.toWei(listingPrice.toString(), "ether");
            await contract.methods
                .listItem(listingItem.id, priceInWei)
                .send({ from: account });
            alert("Item successfully listed for sale");
            const updatedUnlisted = userItems.unlisted.filter(
                (item) => item.id !== listingItem.id
            );
            const updatedListed = [
                ...userItems.listed,
                { ...listingItem, price: priceInWei },
            ];
            setUserItems({ unlisted: updatedUnlisted, listed: updatedListed });
            setListingItem(null);
            setListingPrice(0);
        } catch (error) {
            console.error("Listing failed:", error);
            alert("Listing failed. Please check input or network.");
        }
    };

    const handleDelist = async (tokenId) => {
        try {
            await contract.methods.delistItem(tokenId).send({ from: account });
            alert("Item successfully delisted");
            const itemToMove = userItems.listed.find((item) => item.id === tokenId);
            const updatedListed = userItems.listed.filter(
                (item) => item.id !== tokenId
            );
            const updatedUnlisted = [
                ...userItems.unlisted,
                { ...itemToMove, price: 0 },
            ];
            setUserItems({ unlisted: updatedUnlisted, listed: updatedListed });
        } catch (error) {
            console.error("Delisting failed:", error);
            alert("Delisting failed. Please try again.");
        }
    };
    const networkId = web3.eth.net.getId();
    console.log("Current network ID:", networkId);

    async function testTotalSupply() {
      try {
          const totalItems = await contract.methods.totalSupply().call();
          console.log("Total supply:", totalItems);
      } catch (error) {
          console.error("Error calling totalSupply:", error);
      }
  }
  testTotalSupply();
    useEffect(() => {
        loadUserItems();
    }, [contract, account]);

    return (
        <div className="inventory">
            <button onClick={() => setShowMint(!showMint)}>{showMint ? "Close Mint" : "Mint Equipment"}</button>
            {showMint && (
                <div className="mint-section">
                    <h2>Mint Equipment</h2>
                    <label>
                        Equipment Type:
                        <select
                            value={equipmentType}
                            onChange={(e) => setEquipmentType(parseInt(e.target.value))}
                        >
                            {equipmentTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={equipmentName}
                            onChange={(e) => setEquipmentName(e.target.value)}
                            placeholder="Enter equipment name"
                        />
                    </label>
                    <h3>Attributes</h3>
                    {attributeNames.map((attr, index) => (
                        <label key={index}>
                            {attr}:
                            <input
                                type="number"
                                min="0"
                                value={attributes[index]}
                                onChange={(e) => handleAttributeChange(index, e.target.value)}
                            />
                        </label>
                    ))}
                    <p>Mint Cost: {totalValue} ETH</p>
                    <button onClick={handleMint}>Mint</button>
                </div>
            )}
            <div className="item-list">
                <h2>Unlisted Items</h2>
                {userItems.unlisted.length === 0 ? (
                    <p>No unlisted items</p>
                ) : (
                    userItems.unlisted.map((item) => (
                        <div key={item.id} className="item">
                            <img
                                src={`/images/${equipmentTypes[item.type].name}.png`}
                                alt={item.name}
                            />
                            <p>Name: {item.name}</p>
                            <p>Type: {equipmentTypes[item.type].name}</p>
                            <p>
                                Attributes:
                                {item.attributes
                                    .map((val, idx) => `${attributeNames[idx]}: ${val}`)
                                    .join(", ")}
                            </p>
                            <button onClick={() => setListingItem(item)}>List for Sale</button>
                        </div>
                    ))
                )}
            </div>
            <div className="item-list">
                <h2>Listed Items</h2>
                {userItems.listed.length === 0 ? (
                    <p>No listed items</p>
                ) : (
                    userItems.listed.map((item) => (
                        <div key={item.id} className="item">
                            <img
                                src={`/images/${equipmentTypes[item.type].name}.png`}
                                alt={item.name}
                            />
                            <p>Name: {item.name}</p>
                            <p>Type: {equipmentTypes[item.type].name}</p>
                            <p>
                                Price: {web3.utils.fromWei(item.price.toString(), "ether")} ETH
                            </p>
                            <button onClick={() => handleDelist(item.id)}>Delist</button>
                        </div>
                    ))
                )}
            </div>
            {listingItem && (
                <div className="listing-form">
                    <h3>List Item for Sale</h3>
                    <label>
                        Price (ETH):
                        <input
                            type="number"
                            value={listingPrice}
                            step="0.001"
                            min="0"
                            placeholder="Enter price in ETH"
                            onChange={(e) => setListingPrice(e.target.value)}
                        />
                    </label>
                    <button onClick={handleList}>List</button>
                    <button onClick={() => setListingItem(null)}>Cancel</button>
                </div>
            )}
        </div>
    );
}

export default Inventory;