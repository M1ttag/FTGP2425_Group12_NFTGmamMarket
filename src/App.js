import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Market from "./Market";
import Inventory from "./Inventory";
import "./styles.css";
import { useTranslation } from "react-i18next";
import "./i18n"; // 导入 i18n 配置

// 替换为您的合约ABI和地址
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "buyItem",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "delistItem",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC721IncorrectOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ERC721InsufficientApproval",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC721InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "ERC721InvalidOperator",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC721InvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC721InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC721InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ERC721NonexistentToken",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "approved",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "ApprovalForAll",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "enum EquipmentNFT.EquipmentType",
				"name": "eqType",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			}
		],
		"name": "EquipmentMinted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "ItemBought",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			}
		],
		"name": "ItemDelisted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "forSale",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "salePrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "forRent",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "rentalPricePerDay",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "minRentalDays",
				"type": "uint256"
			}
		],
		"name": "ItemListed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "renter",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "rentalDays",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalRentalPrice",
				"type": "uint256"
			}
		],
		"name": "ItemRented",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "forSale",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "salePrice",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "forRent",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "rentalPricePerDay",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minRentalDays",
				"type": "uint256"
			}
		],
		"name": "listItem",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "enum EquipmentNFT.EquipmentType",
				"name": "_type",
				"type": "uint8"
			},
			{
				"internalType": "uint256[12]",
				"name": "_attributes",
				"type": "uint256[12]"
			},
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			}
		],
		"name": "mintEquipment",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "rentalDays",
				"type": "uint256"
			}
		],
		"name": "rentItem",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "setApprovalForAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint64",
				"name": "expires",
				"type": "uint64"
			}
		],
		"name": "setUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint64",
				"name": "expires",
				"type": "uint64"
			}
		],
		"name": "UpdateUser",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "ABP_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "AP_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ARM_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ARP_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "AS_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256[12]",
				"name": "_attributes",
				"type": "uint256[12]"
			}
		],
		"name": "calculateTotalValue",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "equipments",
		"outputs": [
			{
				"internalType": "enum EquipmentNFT.EquipmentType",
				"name": "eqType",
				"type": "uint8"
			},
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "attackPower",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "abilityPower",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "armorPenetration",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "lifeSteal",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "attackSpeed",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "healthPoints",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "armor",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "magicResist",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "mana",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "manaRegeneration",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "movementSpeed",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "healingShielding",
						"type": "uint256"
					}
				],
				"internalType": "struct EquipmentNFT.Attributes",
				"name": "attributes",
				"type": "tuple"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "getApproved",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "getEquipment",
		"outputs": [
			{
				"components": [
					{
						"internalType": "enum EquipmentNFT.EquipmentType",
						"name": "eqType",
						"type": "uint8"
					},
					{
						"components": [
							{
								"internalType": "uint256",
								"name": "attackPower",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "abilityPower",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "armorPenetration",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "lifeSteal",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "attackSpeed",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "healthPoints",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "armor",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "magicResist",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "mana",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "manaRegeneration",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "movementSpeed",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "healingShielding",
								"type": "uint256"
							}
						],
						"internalType": "struct EquipmentNFT.Attributes",
						"name": "attributes",
						"type": "tuple"
					},
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					}
				],
				"internalType": "struct EquipmentNFT.Equipment",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getListedItems",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "HP_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "HS_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "isApprovedForAll",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "listings",
		"outputs": [
			{
				"internalType": "bool",
				"name": "forSale",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "salePrice",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "forRent",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "rentalPricePerDay",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minRentalDays",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "seller",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "LS_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MANA_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MR_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MRG_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MS_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes4",
				"name": "interfaceId",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "tokenURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "userExpires",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "userOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const contractAddress = "0x8d1f44e9c0b3d71c363be0a7c499858ee3471c7b"; // 替换为您的合约地址
function App() {
	const [web3, setWeb3] = useState(null);
	const [contract, setContract] = useState(null);
	const [account, setAccount] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [currentPage, setCurrentPage] = useState("market");
	const [userAvatar, setUserAvatar] = useState(localStorage.getItem("userAvatar") || "/images/default-avatar.png");
	const [balance, setBalance] = useState("0.00 ETH");
	const [theme, setTheme] = useState("light");
	const [showUserMenu, setShowUserMenu] = useState(false);
	const { t, i18n } = useTranslation();
  
	// 初始化 Web3 和 MetaMask 连接
	useEffect(() => {
	  const initWeb3 = async () => {
		if (window.ethereum) {
		  const web3Instance = new Web3(window.ethereum);
		  setWeb3(web3Instance);
		  try {
			await window.ethereum.request({ method: "eth_requestAccounts" });
			const accounts = await web3Instance.eth.getAccounts();
			setAccount(accounts[0]);
			setIsLoggedIn(true);
			const balanceWei = await web3Instance.eth.getBalance(accounts[0]);
			setBalance(web3Instance.utils.fromWei(balanceWei, "ether") + " ETH");
			const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
			setContract(contractInstance);
		  } catch (error) {
			console.error("用户拒绝连接 MetaMask:", error);
		  }
		} else {
		  console.log("请安装 MetaMask");
		}
	  };
	  initWeb3();
	}, []);
  
	// 处理头像上传
	const handleAvatarUpload = (event) => {
	  const file = event.target.files[0];
	  if (file) {
		const reader = new FileReader();
		reader.onload = (e) => {
		  const avatarUrl = e.target.result;
		  setUserAvatar(avatarUrl);
		  localStorage.setItem("userAvatar", avatarUrl);
		};
		reader.readAsDataURL(file);
	  }
	};
  
	// 切换主题
	const toggleTheme = () => {
	  setTheme(theme === "dark" ? "light" : "dark");
	};
  
	// 切换语言
	const toggleLanguage = () => {
	  const newLang = i18n.language === "en" ? "zh" : "en";
	  i18n.changeLanguage(newLang);
	};
  
	// 退出登录功能
	const handleLogout = () => {
	  setIsLoggedIn(false);
	  setAccount("");
	  setBalance("0.00 ETH");
	  setShowUserMenu(false);
	};
  
	// 未登录时的界面
	if (!isLoggedIn) {
	  return (
		<div className="login-container">
		  <h1 className="login-title">{t("welcome")}</h1>
		  <button className="login-button" onClick={() => window.ethereum.request({ method: "eth_requestAccounts" })}>
			{t("login_with_metamask")}
		  </button>
		</div>
	  );
	}
  
	// 已登录时的界面
	return (
		
	  <div className={`app-container theme-${theme}`}>
		<header className="app-header">
		  <img src="/images/logo.png" alt="Logo" className="app-logo" />
		  <div className="user-info">
			<img
			  src={userAvatar}
			  alt="Avatar"
			  className="user-avatar"
			  onClick={() => setShowUserMenu(!showUserMenu)}
			/>
			<span className="user-balance">{balance}</span>
			{showUserMenu && (
			  <div className="user-menu">
				<input
				  type="file"
				  accept="image/*"
				  onChange={handleAvatarUpload}
				  className="avatar-upload"
				  id="avatar-upload"
				/>
				<label htmlFor="avatar-upload" className="avatar-upload-label">{t("upload_avatar")}</label>
				<button onClick={handleLogout}>{t("logout")}</button>
			  </div>
			)}
			<button className="theme-toggle" onClick={toggleTheme}>
			  {t(theme === "dark" ? "light_mode" : "dark_mode")}
			</button>
			<button className="language-toggle" onClick={toggleLanguage}>
			  {i18n.language === "en" ? "中文" : "English"}
			</button>
		  </div>
		</header>
		<div className="app-body">
		  <nav className="app-sidebar">
			<button
			  onClick={() => setCurrentPage("market")}
			  className={`nav-button ${currentPage === "market" ? "active" : ""}`}
			>
			  {t("market")}
			</button>
			<button
			  onClick={() => setCurrentPage("inventory")}
			  className={`nav-button ${currentPage === "inventory" ? "active" : ""}`}
			>
			  {t("inventory")}
			</button>
		  </nav>
		  <main className="app-content">
			{currentPage === "market" && <Market contract={contract} account={account} web3={web3} theme={theme} />}
			{currentPage === "inventory" && <Inventory contract={contract} account={account} web3={web3} theme={theme} />}
		  </main>
		</div>
	  </div>
	);
  }
  
  export default App;