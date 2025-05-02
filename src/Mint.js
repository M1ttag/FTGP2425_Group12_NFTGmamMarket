import React, { useState } from 'react';

function Mint({ contract, account }) {
    const [type, setType] = useState('0'); // 装备类型
    const [name, setName] = useState(''); // 装备名称
    const [attributes, setAttributes] = useState(Array(12).fill(0)); // 12个属性
    const [totalValue, setTotalValue] = useState('0'); // 预估费用

    // 处理属性变化并实时计算费用
    const handleAttributeChange = async (index, value) => {
        const newAttributes = [...attributes];
        newAttributes[index] = parseInt(value) || 0;
        setAttributes(newAttributes);
        
        try {
            const value = await contract.methods.calculateTotalValue(newAttributes).call();
            setTotalValue(value);
        } catch (error) {
            console.error('计算费用失败:', error);
        }
    };

    // 提交铸造请求
    const handleMint = async () => {
        try {
            await contract.methods.mintEquipment(type, attributes, name).send({
                from: account,
                value: totalValue
            });
            alert('装备铸造成功');
            setName('');
            setAttributes(Array(12).fill(0));
            setTotalValue('0');
        } catch (error) {
            alert('铸造失败: ' + error.message);
        }
    };

    return (
        <div className="mint">
            <h2>铸造装备</h2>
            <form>
                <label>
                    装备类型:
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="0">武器</option>
                        <option value="1">上身</option>
                        <option value="2">裤子</option>
                        <option value="3">鞋子</option>
                        <option value="4">头盔</option>
                    </select>
                </label>
                <br />
                <label>
                    名称:
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <br />
                <h3>属性设置</h3>
                {attributes.map((attr, index) => (
                    <label key={index}>
                        属性 {index + 1} (如攻击力、法强等):
                        <input
                            type="number"
                            min="0"
                            value={attr}
                            onChange={(e) => handleAttributeChange(index, e.target.value)}
                        />
                    </label>
                ))}
                <p>预估铸造费用: {totalValue} wei</p>
                <button type="button" onClick={handleMint}>铸造</button>
            </form>
        </div>
    );
}

export default Mint;