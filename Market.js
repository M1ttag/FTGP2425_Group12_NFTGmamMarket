import React, { useState, useEffect } from "react";

function Market({ contract, account, web3, onSelectEquipment }) {
  // State management
  const [items, setItems] = useState([]); // A list of equipment in the marketplace
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
  }); // Filter criteria
  const [selectedType, setSelectedType] = useState(null); // The selected equipment type
  const [hoveredItem, setHoveredItem] = useState(null); // Mouseover equipment

  // Attribute name mapping (for display and filtering)
  const attributeNames = {
    attackPower: "Power of attack",
    abilityPower: "Strength of spells",
    armorPenetration: "penetration",
    lifeSteal: "Feed on blood",
    attackSpeed: "Speed of attack",
    healthPoints: "Health points",
    armor: "Body armor",
    magicResist: "Magic resistance",
    mana: "Mana value",
    manaRegeneration: "Mana regeneration speed",
    movementSpeed: "Speed of movement",
    healingShielding: "Heal and Shield STRENGTH",
  };

  // Equipment type
  const equipmentTypes = [
    { id: 0, name: "Weapon", icon: "/images/weapon.png" },   
    { id: 1, name: "upperBody", icon: "/images/upperBody.png" },
    { id: 2, name: "pants", icon: "/images/pants.png" },
    { id: 3, name: "shoes", icon: "/images/shoes.png" },
    { id: 4, name: "helmet", icon: "/images/helmet.png" },
  ];

  // laod market data
  useEffect(() => {
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
              price: listing.price,
              type: equipment.eqType,
            };
          })
        );
        setItems(itemsData);
      } catch (error) {
        console.error("Failure to load market:", error);
      }
    };
    loadItems();
  }, [contract, web3]); // Add web3 to the dependency array

  // Handle filter condition changes
  const handleFilterChange = (attr) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [attr]: !prevFilters[attr],
    }));
  };

  // Handle equipment type selection
  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
  };

  // Equipment Selection
  const filteredItems = items.filter((item) => {
    // Equipment type Selection
    if (selectedType !== null && Number(item.type) !== selectedType) {
      return false;
    }

    // Filtering by attribute
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true; // Unchecked attributes are not filtered
      const attrIndex = Object.keys(attributeNames).indexOf(key);
      return item.attributes[attrIndex] > 0; // An attribute value greater than 0 is required to pass the filter
    });
  });

  return (
    <div className="market" style={{ display: "flex" }}>
      {/* Sidebar - Filter properties */}
      <div className="sidebar" style={{ width: "20%", padding: "20px" }}>
        <h3>Filtering attributes</h3>
        {Object.entries(attributeNames).map(([key, label]) => (
          <label key={key} style={{ display: "block", margin: "10px 0" }}>
            <input
              type="checkbox"
              checked={filters[key]}
              onChange={() => handleFilterChange(key)}
            />
            {label}
          </label>
        ))}
      </div>

      {/* Main content area */}
      <div className="main-content" style={{ width: "80%", padding: "20px" }}>
        {/* Equipment type Selection */}
        <div className="type-selector" style={{ marginBottom: "20px" }}>
          {equipmentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              className={selectedType === type.id ? "active" : ""}
              style={{
                margin: "0 10px",
                padding: "10px",
                background: selectedType === type.id ? "#ddd" : "#fff",
              }}
            >
              <img
                src={type.icon}
                alt={type.name}
                style={{ width: "20px", marginRight: "5px" }}
              />
              {type.name}
            </button>
          ))}
        </div>

        {/* Equipment list */}
        <div className="item-list" style={{ display: "flex", flexWrap: "wrap" }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="item"
              onClick={() => onSelectEquipment(item)}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                width: "200px",
                margin: "10px",
                padding: "10px",
                border: "1px solid #ccc",
                position: "relative",
              }}
            >
              <img
                src={`/images/${equipmentTypes[item.type].name}.png`}
                alt={item.name}
                style={{ width: "100px" }}
              />
              <p>{item.name}</p>
              <p>{web3.utils.fromWei(item.price, "ether")} ETH</p>
              {hoveredItem === item && (
                <div
                  className="hover-details"
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "100%",
                    background: "#fff",
                    border: "1px solid #ccc",
                    padding: "10px",
                    zIndex: 10,
                  }}
                >
                  {Object.entries(attributeNames).map(([key, label], idx) => (
                    <p key={idx}>
                      {label}: {item.attributes[idx]}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Market;