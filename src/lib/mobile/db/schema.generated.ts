// สร้างอัตโนมัติจาก prisma/schema.prisma — อย่าแก้ไฟล์นี้ด้วยมือ
// รันใหม่ด้วย: node scripts/gen-sqlite-schema.js
// models: 86

export type PrismaDefault =
  | { kind: "autoincrement" }
  | { kind: "now" }
  | { kind: "uuid" }
  | { kind: "value"; value: string | number | boolean }

export type ScalarFieldMeta = {
  name: string
  kind: "scalar"
  type: "String" | "Int" | "Float" | "Boolean" | "DateTime" | "Json" | "Decimal" | "BigInt" | "Bytes"
  column: string
  isId?: boolean
  isOptional?: boolean
  isUnique?: boolean
  updatedAt?: boolean
  default?: PrismaDefault
}

export type RelationFieldMeta = {
  name: string
  kind: "relation"
  /** ชื่อ model ปลายทาง */
  type: string
  isList: boolean
  isOptional: boolean
  /** owner = ฝั่งที่ถือ foreign key, back = ฝั่งตรงข้าม */
  side?: "owner" | "back"
  /** คอลัมน์ฝั่งนี้ */
  fromFields?: string[]
  /** คอลัมน์ฝั่งปลายทาง */
  toFields?: string[]
  onDelete?: string
}

export type FieldMeta = ScalarFieldMeta | RelationFieldMeta

export type ModelMeta = {
  table: string
  delegate: string
  idField: string | null
  fields: FieldMeta[]
}

export const MODELS: Record<string, ModelMeta> = {
  "User": {
    "table": "User",
    "delegate": "user",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name",
        "isOptional": true
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "tel",
        "kind": "scalar",
        "type": "String",
        "column": "tel",
        "isOptional": true
      },
      {
        "name": "lineid",
        "kind": "scalar",
        "type": "String",
        "column": "lineid",
        "isOptional": true
      },
      {
        "name": "email",
        "kind": "scalar",
        "type": "String",
        "column": "email",
        "isOptional": true,
        "isUnique": true
      },
      {
        "name": "password",
        "kind": "scalar",
        "type": "String",
        "column": "password",
        "isOptional": true
      },
      {
        "name": "package",
        "kind": "scalar",
        "type": "String",
        "column": "package",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "Free"
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "Active"
        }
      },
      {
        "name": "numdate",
        "kind": "scalar",
        "type": "Int",
        "column": "numdate",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 30
        }
      },
      {
        "name": "enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "enddate",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "tunnelUrl",
        "kind": "scalar",
        "type": "String",
        "column": "tunnelUrl",
        "isOptional": true
      },
      {
        "name": "apiToken",
        "kind": "scalar",
        "type": "String",
        "column": "apiToken",
        "isOptional": true
      },
      {
        "name": "pairingCode",
        "kind": "scalar",
        "type": "String",
        "column": "pairingCode",
        "isOptional": true
      },
      {
        "name": "pairingCodeExpiresAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "pairingCodeExpiresAt",
        "isOptional": true
      },
      {
        "name": "employees",
        "kind": "relation",
        "type": "SettingEmployee",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "id_company"
        ]
      },
      {
        "name": "connectionsFrom",
        "kind": "relation",
        "type": "BranchConnection",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "fromUserId"
        ]
      },
      {
        "name": "connectionsTo",
        "kind": "relation",
        "type": "BranchConnection",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "toUserId"
        ]
      }
    ]
  },
  "SettingEmployee": {
    "table": "SettingEmployee",
    "delegate": "settingEmployee",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name",
        "isOptional": true
      },
      {
        "name": "position",
        "kind": "scalar",
        "type": "String",
        "column": "position",
        "isOptional": true
      },
      {
        "name": "level",
        "kind": "scalar",
        "type": "String",
        "column": "level",
        "isOptional": true
      },
      {
        "name": "username",
        "kind": "scalar",
        "type": "String",
        "column": "username",
        "isOptional": true,
        "isUnique": true
      },
      {
        "name": "password",
        "kind": "scalar",
        "type": "String",
        "column": "password",
        "isOptional": true
      },
      {
        "name": "passwords",
        "kind": "scalar",
        "type": "String",
        "column": "passwords",
        "isOptional": true
      },
      {
        "name": "mobile",
        "kind": "scalar",
        "type": "Boolean",
        "column": "mobile",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "timeIn",
        "kind": "scalar",
        "type": "String",
        "column": "timeIn",
        "isOptional": true
      },
      {
        "name": "timeOut",
        "kind": "scalar",
        "type": "String",
        "column": "timeOut",
        "isOptional": true
      },
      {
        "name": "salary",
        "kind": "scalar",
        "type": "Float",
        "column": "salary",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "otRate",
        "kind": "scalar",
        "type": "Float",
        "column": "otRate",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "id_company",
        "kind": "scalar",
        "type": "Int",
        "column": "id_company"
      },
      {
        "name": "users",
        "kind": "relation",
        "type": "User",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "id_company"
        ],
        "toFields": [
          "id"
        ]
      },
      {
        "name": "checkinFace",
        "kind": "relation",
        "type": "CheckinFace",
        "isList": false,
        "isOptional": true,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "employeeId"
        ]
      },
      {
        "name": "permissions",
        "kind": "relation",
        "type": "EmployeePermission",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "employeeId"
        ]
      }
    ]
  },
  "CheckinFace": {
    "table": "CheckinFace",
    "delegate": "checkinFace",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "employeeId",
        "kind": "scalar",
        "type": "Int",
        "column": "employeeId",
        "isUnique": true
      },
      {
        "name": "faceDescriptor",
        "kind": "scalar",
        "type": "String",
        "column": "faceDescriptor",
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      },
      {
        "name": "employee",
        "kind": "relation",
        "type": "SettingEmployee",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "employeeId"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "Getagory": {
    "table": "Getagory",
    "delegate": "getagory",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      }
    ]
  },
  "Group": {
    "table": "Group",
    "delegate": "group",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      }
    ]
  },
  "Fixname": {
    "table": "Fixname",
    "delegate": "fixname",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "shortlist",
        "kind": "scalar",
        "type": "String",
        "column": "shortlist",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      }
    ]
  },
  "Type": {
    "table": "Type",
    "delegate": "type",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "shortlist",
        "kind": "scalar",
        "type": "String",
        "column": "shortlist",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      }
    ]
  },
  "Unit": {
    "table": "Unit",
    "delegate": "unit",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      }
    ]
  },
  "Area": {
    "table": "Area",
    "delegate": "area",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      }
    ]
  },
  "Datalist": {
    "table": "Datalist",
    "delegate": "datalist",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "code",
        "kind": "scalar",
        "type": "String",
        "column": "code",
        "isOptional": true
      },
      {
        "name": "ProductName",
        "kind": "scalar",
        "type": "String",
        "column": "ProductName",
        "isOptional": true
      },
      {
        "name": "fixname",
        "kind": "scalar",
        "type": "String",
        "column": "fixname",
        "isOptional": true
      },
      {
        "name": "group",
        "kind": "scalar",
        "type": "String",
        "column": "group",
        "isOptional": true
      },
      {
        "name": "type",
        "kind": "scalar",
        "type": "String",
        "column": "type",
        "isOptional": true
      },
      {
        "name": "subtype",
        "kind": "scalar",
        "type": "String",
        "column": "subtype",
        "isOptional": true
      },
      {
        "name": "Category",
        "kind": "scalar",
        "type": "String",
        "column": "Category",
        "isOptional": true
      },
      {
        "name": "DrugRegistor",
        "kind": "scalar",
        "type": "String",
        "column": "DrugRegistor",
        "isOptional": true
      },
      {
        "name": "Area",
        "kind": "scalar",
        "type": "String",
        "column": "Area",
        "isOptional": true
      },
      {
        "name": "Unit",
        "kind": "scalar",
        "type": "String",
        "column": "Unit",
        "isOptional": true
      },
      {
        "name": "Barcode",
        "kind": "scalar",
        "type": "String",
        "column": "Barcode",
        "isOptional": true
      },
      {
        "name": "AlarmExp",
        "kind": "scalar",
        "type": "String",
        "column": "AlarmExp",
        "isOptional": true
      },
      {
        "name": "Remark",
        "kind": "scalar",
        "type": "String",
        "column": "Remark",
        "isOptional": true
      },
      {
        "name": "Show",
        "kind": "scalar",
        "type": "String",
        "column": "Show",
        "isOptional": true
      },
      {
        "name": "Child",
        "kind": "scalar",
        "type": "String",
        "column": "Child",
        "isOptional": true
      },
      {
        "name": "CI",
        "kind": "scalar",
        "type": "String",
        "column": "CI",
        "isOptional": true
      },
      {
        "name": "CostActual",
        "kind": "scalar",
        "type": "Float",
        "column": "CostActual",
        "isOptional": true
      },
      {
        "name": "price",
        "kind": "scalar",
        "type": "Float",
        "column": "price",
        "isOptional": true
      },
      {
        "name": "wholesaleprice",
        "kind": "scalar",
        "type": "Float",
        "column": "wholesaleprice",
        "isOptional": true
      },
      {
        "name": "online",
        "kind": "scalar",
        "type": "Float",
        "column": "online",
        "isOptional": true
      },
      {
        "name": "PriceA",
        "kind": "scalar",
        "type": "Float",
        "column": "PriceA",
        "isOptional": true
      },
      {
        "name": "PriceB",
        "kind": "scalar",
        "type": "Float",
        "column": "PriceB",
        "isOptional": true
      },
      {
        "name": "PriceC",
        "kind": "scalar",
        "type": "Float",
        "column": "PriceC",
        "isOptional": true
      },
      {
        "name": "PriceD",
        "kind": "scalar",
        "type": "Float",
        "column": "PriceD",
        "isOptional": true
      },
      {
        "name": "PriceE",
        "kind": "scalar",
        "type": "Float",
        "column": "PriceE",
        "isOptional": true
      },
      {
        "name": "PriceF",
        "kind": "scalar",
        "type": "Float",
        "column": "PriceF",
        "isOptional": true
      },
      {
        "name": "PriceG",
        "kind": "scalar",
        "type": "Float",
        "column": "PriceG",
        "isOptional": true
      },
      {
        "name": "PriceH",
        "kind": "scalar",
        "type": "Float",
        "column": "PriceH",
        "isOptional": true
      },
      {
        "name": "Max",
        "kind": "scalar",
        "type": "Float",
        "column": "Max",
        "isOptional": true
      },
      {
        "name": "Min",
        "kind": "scalar",
        "type": "Float",
        "column": "Min",
        "isOptional": true
      },
      {
        "name": "ROP",
        "kind": "scalar",
        "type": "Float",
        "column": "ROP",
        "isOptional": true
      },
      {
        "name": "pic",
        "kind": "scalar",
        "type": "String",
        "column": "pic",
        "isOptional": true
      },
      {
        "name": "maker",
        "kind": "scalar",
        "type": "String",
        "column": "maker",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "qty_unit",
        "kind": "scalar",
        "type": "String",
        "column": "qty_unit",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "concentration",
        "kind": "scalar",
        "type": "Float",
        "column": "concentration",
        "isOptional": true
      },
      {
        "name": "dosePerKg",
        "kind": "scalar",
        "type": "Float",
        "column": "dosePerKg",
        "isOptional": true
      },
      {
        "name": "doseFrequency",
        "kind": "scalar",
        "type": "Int",
        "column": "doseFrequency",
        "isOptional": true
      },
      {
        "name": "maxDosePerDay",
        "kind": "scalar",
        "type": "Float",
        "column": "maxDosePerDay",
        "isOptional": true
      },
      {
        "name": "memberDiscountEligible",
        "kind": "scalar",
        "type": "Boolean",
        "column": "memberDiscountEligible",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "requireLot",
        "kind": "scalar",
        "type": "Boolean",
        "column": "requireLot",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "drugSetItems",
        "kind": "relation",
        "type": "DrugSetItem",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "productId"
        ]
      }
    ]
  },
  "ProductBarcode": {
    "table": "ProductBarcode",
    "delegate": "productBarcode",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "productCode",
        "kind": "scalar",
        "type": "String",
        "column": "productCode"
      },
      {
        "name": "productId",
        "kind": "scalar",
        "type": "Int",
        "column": "productId",
        "isOptional": true
      },
      {
        "name": "barcode",
        "kind": "scalar",
        "type": "String",
        "column": "barcode"
      },
      {
        "name": "note",
        "kind": "scalar",
        "type": "String",
        "column": "note",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "isActive",
        "kind": "scalar",
        "type": "Boolean",
        "column": "isActive",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "createdBy",
        "kind": "scalar",
        "type": "String",
        "column": "createdBy",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "DrugSet": {
    "table": "DrugSet",
    "delegate": "drugSet",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name"
      },
      {
        "name": "description",
        "kind": "scalar",
        "type": "String",
        "column": "description",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "active"
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      },
      {
        "name": "items",
        "kind": "relation",
        "type": "DrugSetItem",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "drugSetId"
        ]
      }
    ]
  },
  "DrugSetItem": {
    "table": "DrugSetItem",
    "delegate": "drugSetItem",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "drugSetId",
        "kind": "scalar",
        "type": "Int",
        "column": "drugSetId"
      },
      {
        "name": "productId",
        "kind": "scalar",
        "type": "Int",
        "column": "productId",
        "isOptional": true
      },
      {
        "name": "code",
        "kind": "scalar",
        "type": "String",
        "column": "code",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "fixname",
        "kind": "scalar",
        "type": "String",
        "column": "fixname",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "drugGroup",
        "kind": "scalar",
        "type": "String",
        "column": "drugGroup",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "barcode",
        "kind": "scalar",
        "type": "String",
        "column": "barcode",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Float",
        "column": "qty",
        "default": {
          "kind": "value",
          "value": 1
        }
      },
      {
        "name": "salePrice",
        "kind": "scalar",
        "type": "Float",
        "column": "salePrice",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "cost",
        "kind": "scalar",
        "type": "Float",
        "column": "cost",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "sortOrder",
        "kind": "scalar",
        "type": "Int",
        "column": "sortOrder",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "unitConversionId",
        "kind": "scalar",
        "type": "Int",
        "column": "unitConversionId",
        "isOptional": true
      },
      {
        "name": "saleUnit",
        "kind": "scalar",
        "type": "String",
        "column": "saleUnit",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "subQty",
        "kind": "scalar",
        "type": "Float",
        "column": "subQty",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 1
        }
      },
      {
        "name": "priceOverride",
        "kind": "scalar",
        "type": "Float",
        "column": "priceOverride",
        "isOptional": true
      },
      {
        "name": "drugSet",
        "kind": "relation",
        "type": "DrugSet",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "drugSetId"
        ],
        "toFields": [
          "id"
        ],
        "onDelete": "Cascade"
      },
      {
        "name": "product",
        "kind": "relation",
        "type": "Datalist",
        "isList": false,
        "isOptional": true,
        "side": "owner",
        "fromFields": [
          "productId"
        ],
        "toFields": [
          "id"
        ],
        "onDelete": "SetNull"
      }
    ]
  },
  "Customer": {
    "table": "Customer",
    "delegate": "customer",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "code",
        "kind": "scalar",
        "type": "String",
        "column": "code",
        "isOptional": true
      },
      {
        "name": "sex",
        "kind": "scalar",
        "type": "String",
        "column": "sex",
        "isOptional": true
      },
      {
        "name": "idcode",
        "kind": "scalar",
        "type": "String",
        "column": "idcode",
        "isOptional": true
      },
      {
        "name": "age",
        "kind": "scalar",
        "type": "Int",
        "column": "age",
        "isOptional": true
      },
      {
        "name": "address",
        "kind": "scalar",
        "type": "String",
        "column": "address",
        "isOptional": true
      },
      {
        "name": "branch",
        "kind": "scalar",
        "type": "String",
        "column": "branch",
        "isOptional": true
      },
      {
        "name": "levelPrice",
        "kind": "scalar",
        "type": "String",
        "column": "levelPrice",
        "isOptional": true
      },
      {
        "name": "tel",
        "kind": "scalar",
        "type": "String",
        "column": "tel",
        "isOptional": true
      },
      {
        "name": "pointStart",
        "kind": "scalar",
        "type": "Int",
        "column": "pointStart",
        "isOptional": true
      },
      {
        "name": "point",
        "kind": "scalar",
        "type": "Int",
        "column": "point",
        "isOptional": true
      },
      {
        "name": "totalPoint",
        "kind": "scalar",
        "type": "Int",
        "column": "totalPoint",
        "isOptional": true
      },
      {
        "name": "customer",
        "kind": "scalar",
        "type": "String",
        "column": "customer",
        "isOptional": true
      },
      {
        "name": "congenitalDisease",
        "kind": "scalar",
        "type": "String",
        "column": "congenitalDisease",
        "isOptional": true
      },
      {
        "name": "names",
        "kind": "scalar",
        "type": "String",
        "column": "names",
        "isOptional": true
      },
      {
        "name": "statuss",
        "kind": "scalar",
        "type": "String",
        "column": "statuss",
        "isOptional": true
      },
      {
        "name": "birthday",
        "kind": "scalar",
        "type": "String",
        "column": "birthday",
        "isOptional": true
      },
      {
        "name": "numbertax",
        "kind": "scalar",
        "type": "String",
        "column": "numbertax",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "moreInfo",
        "kind": "scalar",
        "type": "String",
        "column": "moreInfo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "drugallergys",
        "kind": "relation",
        "type": "Drugallergy",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "id_cus"
        ]
      }
    ]
  },
  "Drugallergy": {
    "table": "Drugallergy",
    "delegate": "drugallergy",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "drugallergy",
        "kind": "scalar",
        "type": "String",
        "column": "drugallergy",
        "isOptional": true
      },
      {
        "name": "remark",
        "kind": "scalar",
        "type": "String",
        "column": "remark",
        "isOptional": true
      },
      {
        "name": "id_cus",
        "kind": "scalar",
        "type": "Int",
        "column": "id_cus"
      },
      {
        "name": "salemain",
        "kind": "relation",
        "type": "Customer",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "id_cus"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "Supplier": {
    "table": "Supplier",
    "delegate": "supplier",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "code",
        "kind": "scalar",
        "type": "String",
        "column": "code",
        "isOptional": true
      },
      {
        "name": "names",
        "kind": "scalar",
        "type": "String",
        "column": "names",
        "isOptional": true
      },
      {
        "name": "tel",
        "kind": "scalar",
        "type": "String",
        "column": "tel",
        "isOptional": true
      },
      {
        "name": "idcode",
        "kind": "scalar",
        "type": "String",
        "column": "idcode",
        "isOptional": true
      },
      {
        "name": "address",
        "kind": "scalar",
        "type": "String",
        "column": "address",
        "isOptional": true
      },
      {
        "name": "statuss",
        "kind": "scalar",
        "type": "String",
        "column": "statuss",
        "isOptional": true
      },
      {
        "name": "leadtime",
        "kind": "scalar",
        "type": "Int",
        "column": "leadtime",
        "isOptional": true
      },
      {
        "name": "email",
        "kind": "scalar",
        "type": "String",
        "column": "email",
        "isOptional": true
      }
    ]
  },
  "Receive": {
    "table": "Receive",
    "delegate": "receive",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "code",
        "kind": "scalar",
        "type": "String",
        "column": "code",
        "isOptional": true
      },
      {
        "name": "orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "orderNo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "orderfull",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "names",
        "kind": "scalar",
        "type": "String",
        "column": "names",
        "isOptional": true
      },
      {
        "name": "invoice_No",
        "kind": "scalar",
        "type": "String",
        "column": "invoice_No",
        "isOptional": true
      },
      {
        "name": "statuss",
        "kind": "scalar",
        "type": "String",
        "column": "statuss",
        "isOptional": true
      },
      {
        "name": "order_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "order_date",
        "isOptional": true
      },
      {
        "name": "receive_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "receive_date",
        "isOptional": true
      },
      {
        "name": "tax_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "tax_date",
        "isOptional": true
      },
      {
        "name": "tax_no",
        "kind": "scalar",
        "type": "String",
        "column": "tax_no",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "pay_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "pay_date",
        "isOptional": true
      },
      {
        "name": "codenames",
        "kind": "scalar",
        "type": "String",
        "column": "codenames",
        "isOptional": true
      },
      {
        "name": "persons",
        "kind": "scalar",
        "type": "String",
        "column": "persons",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "totalRC",
        "kind": "scalar",
        "type": "Float",
        "column": "totalRC",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "vatRC",
        "kind": "scalar",
        "type": "Float",
        "column": "vatRC",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "discountRC",
        "kind": "scalar",
        "type": "Float",
        "column": "discountRC",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "totalRCAll",
        "kind": "scalar",
        "type": "Float",
        "column": "totalRCAll",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "countorder",
        "kind": "scalar",
        "type": "Float",
        "column": "countorder",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "purchase_debit_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "purchase_debit_date",
        "isOptional": true
      },
      {
        "name": "purchase_debit_number",
        "kind": "scalar",
        "type": "Int",
        "column": "purchase_debit_number",
        "isOptional": true
      },
      {
        "name": "purchase_debit_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_debit_orderNo",
        "isOptional": true
      },
      {
        "name": "purchase_debit_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_debit_orderfull",
        "isOptional": true
      },
      {
        "name": "purchase_debit_status",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_debit_status",
        "isOptional": true
      },
      {
        "name": "purchase_debit_person",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_debit_person",
        "isOptional": true
      },
      {
        "name": "purchase_debit_remark",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_debit_remark",
        "isOptional": true
      },
      {
        "name": "purchase_debit_reference_no",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_debit_reference_no",
        "isOptional": true
      },
      {
        "name": "purchase_debit_reference_book_no",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_debit_reference_book_no",
        "isOptional": true
      },
      {
        "name": "purchase_debit_reason",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_debit_reason",
        "isOptional": true
      },
      {
        "name": "purchase_debit_original_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_debit_original_amount",
        "isOptional": true
      },
      {
        "name": "purchase_debit_correct_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_debit_correct_amount",
        "isOptional": true
      },
      {
        "name": "purchase_debit_difference_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_debit_difference_amount",
        "isOptional": true
      },
      {
        "name": "purchase_debit_vat_rate",
        "kind": "scalar",
        "type": "Int",
        "column": "purchase_debit_vat_rate",
        "isOptional": true
      },
      {
        "name": "purchase_debit_vat_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_debit_vat_amount",
        "isOptional": true
      },
      {
        "name": "purchase_debit_grand_total",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_debit_grand_total",
        "isOptional": true
      },
      {
        "name": "purchase_credit_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "purchase_credit_date",
        "isOptional": true
      },
      {
        "name": "purchase_credit_number",
        "kind": "scalar",
        "type": "Int",
        "column": "purchase_credit_number",
        "isOptional": true
      },
      {
        "name": "purchase_credit_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_orderNo",
        "isOptional": true
      },
      {
        "name": "purchase_credit_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_orderfull",
        "isOptional": true
      },
      {
        "name": "purchase_credit_status",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_status",
        "isOptional": true
      },
      {
        "name": "purchase_credit_person",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_person",
        "isOptional": true
      },
      {
        "name": "purchase_credit_remark",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_remark",
        "isOptional": true
      },
      {
        "name": "purchase_credit_reference_no",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_reference_no",
        "isOptional": true
      },
      {
        "name": "purchase_credit_reference_book_no",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_reference_book_no",
        "isOptional": true
      },
      {
        "name": "purchase_credit_reason",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_reason",
        "isOptional": true
      },
      {
        "name": "purchase_credit_item_name",
        "kind": "scalar",
        "type": "String",
        "column": "purchase_credit_item_name",
        "isOptional": true
      },
      {
        "name": "purchase_credit_item_qty",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_credit_item_qty",
        "isOptional": true
      },
      {
        "name": "purchase_credit_items_json",
        "kind": "scalar",
        "type": "Json",
        "column": "purchase_credit_items_json",
        "isOptional": true
      },
      {
        "name": "purchase_credit_original_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_credit_original_amount",
        "isOptional": true
      },
      {
        "name": "purchase_credit_correct_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_credit_correct_amount",
        "isOptional": true
      },
      {
        "name": "purchase_credit_difference_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_credit_difference_amount",
        "isOptional": true
      },
      {
        "name": "purchase_credit_reduce_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_credit_reduce_amount",
        "isOptional": true
      },
      {
        "name": "purchase_credit_vat_rate",
        "kind": "scalar",
        "type": "Int",
        "column": "purchase_credit_vat_rate",
        "isOptional": true
      },
      {
        "name": "purchase_credit_vat_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_credit_vat_amount",
        "isOptional": true
      },
      {
        "name": "purchase_credit_net_total",
        "kind": "scalar",
        "type": "Float",
        "column": "purchase_credit_net_total",
        "isOptional": true
      },
      {
        "name": "confirmRecord",
        "kind": "relation",
        "type": "ConfirmRC",
        "isList": false,
        "isOptional": true,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "receiveId"
        ]
      }
    ]
  },
  "ConfirmRC": {
    "table": "ConfirmRC",
    "delegate": "confirmRC",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "receiveId",
        "kind": "scalar",
        "type": "Int",
        "column": "receiveId",
        "isUnique": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "confirmed"
        }
      },
      {
        "name": "confirmedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "confirmedAt",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "confirmedBy",
        "kind": "scalar",
        "type": "String",
        "column": "confirmedBy",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      },
      {
        "name": "receive",
        "kind": "relation",
        "type": "Receive",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "receiveId"
        ],
        "toFields": [
          "id"
        ],
        "onDelete": "Cascade"
      }
    ]
  },
  "RCitemlist": {
    "table": "RCitemlist",
    "delegate": "rCitemlist",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "codenames",
        "kind": "scalar",
        "type": "String",
        "column": "codenames",
        "isOptional": true
      },
      {
        "name": "itemcode",
        "kind": "scalar",
        "type": "String",
        "column": "itemcode",
        "isOptional": true
      },
      {
        "name": "itemName",
        "kind": "scalar",
        "type": "String",
        "column": "itemName",
        "isOptional": true
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "newCost",
        "kind": "scalar",
        "type": "Float",
        "column": "newCost",
        "isOptional": true
      },
      {
        "name": "netCost",
        "kind": "scalar",
        "type": "Float",
        "column": "netCost",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Float",
        "column": "qty",
        "isOptional": true
      },
      {
        "name": "totalcost",
        "kind": "scalar",
        "type": "Float",
        "column": "totalcost",
        "isOptional": true
      },
      {
        "name": "lot",
        "kind": "scalar",
        "type": "String",
        "column": "lot",
        "isOptional": true
      },
      {
        "name": "dateExp",
        "kind": "scalar",
        "type": "DateTime",
        "column": "dateExp",
        "isOptional": true
      },
      {
        "name": "freebaht",
        "kind": "scalar",
        "type": "Float",
        "column": "freebaht",
        "isOptional": true
      },
      {
        "name": "discountbaht",
        "kind": "scalar",
        "type": "Float",
        "column": "discountbaht",
        "isOptional": true
      },
      {
        "name": "sale",
        "kind": "scalar",
        "type": "Float",
        "column": "sale",
        "isOptional": true
      },
      {
        "name": "Barcode",
        "kind": "scalar",
        "type": "String",
        "column": "Barcode",
        "isOptional": true
      },
      {
        "name": "type",
        "kind": "scalar",
        "type": "String",
        "column": "type",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "subtype",
        "kind": "scalar",
        "type": "String",
        "column": "subtype",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "statuss",
        "kind": "scalar",
        "type": "String",
        "column": "statuss",
        "isOptional": true
      },
      {
        "name": "dateRC",
        "kind": "scalar",
        "type": "DateTime",
        "column": "dateRC",
        "isOptional": true
      },
      {
        "name": "balance",
        "kind": "scalar",
        "type": "Float",
        "column": "balance",
        "isOptional": true
      },
      {
        "name": "codevender",
        "kind": "scalar",
        "type": "String",
        "column": "codevender",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "namevender",
        "kind": "scalar",
        "type": "String",
        "column": "namevender",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "maker",
        "kind": "scalar",
        "type": "String",
        "column": "maker",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "qty_unit",
        "kind": "scalar",
        "type": "String",
        "column": "qty_unit",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "saleQty",
        "kind": "scalar",
        "type": "Float",
        "column": "saleQty",
        "isOptional": true
      },
      {
        "name": "saleUnit",
        "kind": "scalar",
        "type": "String",
        "column": "saleUnit",
        "isOptional": true
      },
      {
        "name": "saleFactor",
        "kind": "scalar",
        "type": "Float",
        "column": "saleFactor",
        "isOptional": true
      }
    ]
  },
  "SaleMain": {
    "table": "SaleMain",
    "delegate": "saleMain",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "id_costomer",
        "kind": "scalar",
        "type": "Int",
        "column": "id_costomer",
        "isOptional": true
      },
      {
        "name": "code_costomer",
        "kind": "scalar",
        "type": "String",
        "column": "code_costomer",
        "isOptional": true
      },
      {
        "name": "group_price",
        "kind": "scalar",
        "type": "String",
        "column": "group_price",
        "isOptional": true
      },
      {
        "name": "pay",
        "kind": "scalar",
        "type": "String",
        "column": "pay",
        "isOptional": true
      },
      {
        "name": "bill",
        "kind": "scalar",
        "type": "Int",
        "column": "bill",
        "isOptional": true
      },
      {
        "name": "discount",
        "kind": "scalar",
        "type": "Float",
        "column": "discount",
        "isOptional": true
      },
      {
        "name": "memberDiscount",
        "kind": "scalar",
        "type": "Float",
        "column": "memberDiscount",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "memberDiscountPercent",
        "kind": "scalar",
        "type": "Float",
        "column": "memberDiscountPercent",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "sumtotal",
        "kind": "scalar",
        "type": "Float",
        "column": "sumtotal",
        "isOptional": true
      },
      {
        "name": "addreward",
        "kind": "scalar",
        "type": "Float",
        "column": "addreward",
        "isOptional": true
      },
      {
        "name": "usereward",
        "kind": "scalar",
        "type": "Float",
        "column": "usereward",
        "isOptional": true
      },
      {
        "name": "companyall",
        "kind": "scalar",
        "type": "String",
        "column": "companyall",
        "isOptional": true
      },
      {
        "name": "personall",
        "kind": "scalar",
        "type": "String",
        "column": "personall",
        "isOptional": true
      },
      {
        "name": "statussall",
        "kind": "scalar",
        "type": "String",
        "column": "statussall",
        "isOptional": true
      },
      {
        "name": "totalall",
        "kind": "scalar",
        "type": "Float",
        "column": "totalall",
        "isOptional": true
      },
      {
        "name": "orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "orderNo",
        "isOptional": true
      },
      {
        "name": "transferDetail",
        "kind": "scalar",
        "type": "String",
        "column": "transferDetail",
        "isOptional": true
      },
      {
        "name": "cashAmount",
        "kind": "scalar",
        "type": "Float",
        "column": "cashAmount",
        "isOptional": true
      },
      {
        "name": "transferAmount",
        "kind": "scalar",
        "type": "Float",
        "column": "transferAmount",
        "isOptional": true
      },
      {
        "name": "serviceCharge",
        "kind": "scalar",
        "type": "Float",
        "column": "serviceCharge",
        "isOptional": true
      },
      {
        "name": "serviceChargePercent",
        "kind": "scalar",
        "type": "Float",
        "column": "serviceChargePercent",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "discountReason",
        "kind": "scalar",
        "type": "String",
        "column": "discountReason",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "taxInvoiceNo",
        "kind": "scalar",
        "type": "String",
        "column": "taxInvoiceNo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "vatAmount",
        "kind": "scalar",
        "type": "Float",
        "column": "vatAmount",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "beforeVat",
        "kind": "scalar",
        "type": "Float",
        "column": "beforeVat",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "sales",
        "kind": "relation",
        "type": "Sale",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "id_salemain"
        ]
      },
      {
        "name": "historys",
        "kind": "relation",
        "type": "History",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "id_salemain"
        ]
      }
    ]
  },
  "Sale": {
    "table": "Sale",
    "delegate": "sale",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "id_product",
        "kind": "scalar",
        "type": "Int",
        "column": "id_product",
        "isOptional": true
      },
      {
        "name": "code_product",
        "kind": "scalar",
        "type": "String",
        "column": "code_product",
        "isOptional": true
      },
      {
        "name": "name_product",
        "kind": "scalar",
        "type": "String",
        "column": "name_product",
        "isOptional": true
      },
      {
        "name": "cetagory",
        "kind": "scalar",
        "type": "String",
        "column": "cetagory",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "fixname",
        "kind": "scalar",
        "type": "String",
        "column": "fixname",
        "isOptional": true
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Float",
        "column": "qty",
        "isOptional": true
      },
      {
        "name": "subunit",
        "kind": "scalar",
        "type": "String",
        "column": "subunit",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "subqty",
        "kind": "scalar",
        "type": "Float",
        "column": "subqty",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "cost",
        "kind": "scalar",
        "type": "Float",
        "column": "cost",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "price",
        "kind": "scalar",
        "type": "Float",
        "column": "price",
        "isOptional": true
      },
      {
        "name": "discount",
        "kind": "scalar",
        "type": "Float",
        "column": "discount",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "memberDiscount",
        "kind": "scalar",
        "type": "Float",
        "column": "memberDiscount",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "memberDiscountPercent",
        "kind": "scalar",
        "type": "Float",
        "column": "memberDiscountPercent",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "total",
        "kind": "scalar",
        "type": "Float",
        "column": "total",
        "isOptional": true
      },
      {
        "name": "barcode",
        "kind": "scalar",
        "type": "String",
        "column": "barcode",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "id_receive1",
        "kind": "scalar",
        "type": "Float",
        "column": "id_receive1",
        "isOptional": true
      },
      {
        "name": "lot_receive1",
        "kind": "scalar",
        "type": "String",
        "column": "lot_receive1",
        "isOptional": true
      },
      {
        "name": "qty_lot1",
        "kind": "scalar",
        "type": "Float",
        "column": "qty_lot1",
        "isOptional": true
      },
      {
        "name": "id_receive2",
        "kind": "scalar",
        "type": "Float",
        "column": "id_receive2",
        "isOptional": true
      },
      {
        "name": "lot_receive2",
        "kind": "scalar",
        "type": "String",
        "column": "lot_receive2",
        "isOptional": true
      },
      {
        "name": "qty_lot2",
        "kind": "scalar",
        "type": "Float",
        "column": "qty_lot2",
        "isOptional": true
      },
      {
        "name": "id_receive3",
        "kind": "scalar",
        "type": "Float",
        "column": "id_receive3",
        "isOptional": true
      },
      {
        "name": "lot_receive3",
        "kind": "scalar",
        "type": "String",
        "column": "lot_receive3",
        "isOptional": true
      },
      {
        "name": "qty_lot3",
        "kind": "scalar",
        "type": "Float",
        "column": "qty_lot3",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "statuss",
        "kind": "scalar",
        "type": "String",
        "column": "statuss",
        "isOptional": true
      },
      {
        "name": "type",
        "kind": "scalar",
        "type": "String",
        "column": "type",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "name_customer",
        "kind": "scalar",
        "type": "String",
        "column": "name_customer",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "id_card",
        "kind": "scalar",
        "type": "String",
        "column": "id_card",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "phone",
        "kind": "scalar",
        "type": "String",
        "column": "phone",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "pharmacy",
        "kind": "scalar",
        "type": "String",
        "column": "pharmacy",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "gifts",
        "kind": "scalar",
        "type": "Float",
        "column": "gifts",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "id_salemain",
        "kind": "scalar",
        "type": "Int",
        "column": "id_salemain"
      },
      {
        "name": "salemain",
        "kind": "relation",
        "type": "SaleMain",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "id_salemain"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "History": {
    "table": "History",
    "delegate": "history",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "id_costomer",
        "kind": "scalar",
        "type": "Int",
        "column": "id_costomer",
        "isOptional": true
      },
      {
        "name": "code_costomer",
        "kind": "scalar",
        "type": "String",
        "column": "code_costomer",
        "isOptional": true
      },
      {
        "name": "name_customer",
        "kind": "scalar",
        "type": "String",
        "column": "name_customer",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "duedate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "duedate",
        "isOptional": true
      },
      {
        "name": "followup",
        "kind": "scalar",
        "type": "String",
        "column": "followup",
        "isOptional": true
      },
      {
        "name": "solution",
        "kind": "scalar",
        "type": "String",
        "column": "solution",
        "isOptional": true
      },
      {
        "name": "duedate1",
        "kind": "scalar",
        "type": "DateTime",
        "column": "duedate1",
        "isOptional": true
      },
      {
        "name": "followup1",
        "kind": "scalar",
        "type": "String",
        "column": "followup1",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "solution1",
        "kind": "scalar",
        "type": "String",
        "column": "solution1",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "duedate2",
        "kind": "scalar",
        "type": "DateTime",
        "column": "duedate2",
        "isOptional": true
      },
      {
        "name": "followup2",
        "kind": "scalar",
        "type": "String",
        "column": "followup2",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "solution2",
        "kind": "scalar",
        "type": "String",
        "column": "solution2",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "id_history",
        "kind": "scalar",
        "type": "Int",
        "column": "id_history",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "count",
        "kind": "scalar",
        "type": "Int",
        "column": "count",
        "isOptional": true
      },
      {
        "name": "statusH",
        "kind": "scalar",
        "type": "String",
        "column": "statusH",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "remark",
        "kind": "scalar",
        "type": "String",
        "column": "remark",
        "isOptional": true
      },
      {
        "name": "id_salemain",
        "kind": "scalar",
        "type": "Int",
        "column": "id_salemain"
      },
      {
        "name": "salemain",
        "kind": "relation",
        "type": "SaleMain",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "id_salemain"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "Gifts": {
    "table": "Gifts",
    "delegate": "gifts",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "id_product",
        "kind": "scalar",
        "type": "Int",
        "column": "id_product",
        "isOptional": true
      },
      {
        "name": "code_product",
        "kind": "scalar",
        "type": "String",
        "column": "code_product",
        "isOptional": true
      },
      {
        "name": "name_product",
        "kind": "scalar",
        "type": "String",
        "column": "name_product",
        "isOptional": true
      },
      {
        "name": "gift",
        "kind": "scalar",
        "type": "Float",
        "column": "gift",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      }
    ]
  },
  "Indicator": {
    "table": "Indicator",
    "delegate": "indicator",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "list_lo",
        "kind": "scalar",
        "type": "String",
        "column": "list_lo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_my",
        "kind": "scalar",
        "type": "String",
        "column": "list_my",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_km",
        "kind": "scalar",
        "type": "String",
        "column": "list_km",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_zh",
        "kind": "scalar",
        "type": "String",
        "column": "list_zh",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_eng",
        "kind": "scalar",
        "type": "String",
        "column": "list_eng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "Methodlist": {
    "table": "Methodlist",
    "delegate": "methodlist",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "String",
        "column": "qty",
        "isOptional": true
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true
      },
      {
        "name": "fullname",
        "kind": "scalar",
        "type": "String",
        "column": "fullname",
        "isOptional": true
      },
      {
        "name": "list_lo",
        "kind": "scalar",
        "type": "String",
        "column": "list_lo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_my",
        "kind": "scalar",
        "type": "String",
        "column": "list_my",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_km",
        "kind": "scalar",
        "type": "String",
        "column": "list_km",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_zh",
        "kind": "scalar",
        "type": "String",
        "column": "list_zh",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_eng",
        "kind": "scalar",
        "type": "String",
        "column": "list_eng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "TimeL": {
    "table": "TimeL",
    "delegate": "timeL",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "list_lo",
        "kind": "scalar",
        "type": "String",
        "column": "list_lo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_my",
        "kind": "scalar",
        "type": "String",
        "column": "list_my",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_km",
        "kind": "scalar",
        "type": "String",
        "column": "list_km",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_zh",
        "kind": "scalar",
        "type": "String",
        "column": "list_zh",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_eng",
        "kind": "scalar",
        "type": "String",
        "column": "list_eng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "UseL": {
    "table": "UseL",
    "delegate": "useL",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "list_lo",
        "kind": "scalar",
        "type": "String",
        "column": "list_lo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_my",
        "kind": "scalar",
        "type": "String",
        "column": "list_my",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_km",
        "kind": "scalar",
        "type": "String",
        "column": "list_km",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_zh",
        "kind": "scalar",
        "type": "String",
        "column": "list_zh",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_eng",
        "kind": "scalar",
        "type": "String",
        "column": "list_eng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "TimeUseL": {
    "table": "TimeUseL",
    "delegate": "timeUseL",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "list_lo",
        "kind": "scalar",
        "type": "String",
        "column": "list_lo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_my",
        "kind": "scalar",
        "type": "String",
        "column": "list_my",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_km",
        "kind": "scalar",
        "type": "String",
        "column": "list_km",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_zh",
        "kind": "scalar",
        "type": "String",
        "column": "list_zh",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_eng",
        "kind": "scalar",
        "type": "String",
        "column": "list_eng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "KeepL": {
    "table": "KeepL",
    "delegate": "keepL",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "list_lo",
        "kind": "scalar",
        "type": "String",
        "column": "list_lo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_my",
        "kind": "scalar",
        "type": "String",
        "column": "list_my",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_km",
        "kind": "scalar",
        "type": "String",
        "column": "list_km",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_zh",
        "kind": "scalar",
        "type": "String",
        "column": "list_zh",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_eng",
        "kind": "scalar",
        "type": "String",
        "column": "list_eng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "RemarkL": {
    "table": "RemarkL",
    "delegate": "remarkL",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "list_lo",
        "kind": "scalar",
        "type": "String",
        "column": "list_lo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_my",
        "kind": "scalar",
        "type": "String",
        "column": "list_my",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_km",
        "kind": "scalar",
        "type": "String",
        "column": "list_km",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_zh",
        "kind": "scalar",
        "type": "String",
        "column": "list_zh",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_eng",
        "kind": "scalar",
        "type": "String",
        "column": "list_eng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "Labeldata": {
    "table": "Labeldata",
    "delegate": "labeldata",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "code",
        "kind": "scalar",
        "type": "String",
        "column": "code",
        "isOptional": true
      },
      {
        "name": "indicatorlistS",
        "kind": "scalar",
        "type": "String",
        "column": "indicatorlistS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "timeS",
        "kind": "scalar",
        "type": "String",
        "column": "timeS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "useS",
        "kind": "scalar",
        "type": "String",
        "column": "useS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "timeuseS",
        "kind": "scalar",
        "type": "String",
        "column": "timeuseS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "keepS",
        "kind": "scalar",
        "type": "String",
        "column": "keepS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "remarkS",
        "kind": "scalar",
        "type": "String",
        "column": "remarkS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "GenericLabel": {
    "table": "GenericLabel",
    "delegate": "genericLabel",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "fixname",
        "kind": "scalar",
        "type": "String",
        "column": "fixname",
        "isOptional": true
      },
      {
        "name": "shortname",
        "kind": "scalar",
        "type": "String",
        "column": "shortname",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "indicatorlistS",
        "kind": "scalar",
        "type": "String",
        "column": "indicatorlistS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "timeS",
        "kind": "scalar",
        "type": "String",
        "column": "timeS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "useS",
        "kind": "scalar",
        "type": "String",
        "column": "useS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "timeuseS",
        "kind": "scalar",
        "type": "String",
        "column": "timeuseS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "keepS",
        "kind": "scalar",
        "type": "String",
        "column": "keepS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "remarkS",
        "kind": "scalar",
        "type": "String",
        "column": "remarkS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "LabelHelper": {
    "table": "LabelHelper",
    "delegate": "labelHelper",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "isDefault",
        "kind": "scalar",
        "type": "Boolean",
        "column": "isDefault",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "suspended",
        "kind": "scalar",
        "type": "Boolean",
        "column": "suspended",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "paperSize",
        "kind": "scalar",
        "type": "String",
        "column": "paperSize",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "80x50"
        }
      },
      {
        "name": "labelStyle",
        "kind": "scalar",
        "type": "String",
        "column": "labelStyle",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "current"
        }
      },
      {
        "name": "title",
        "kind": "scalar",
        "type": "String",
        "column": "title",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "titleOn",
        "kind": "scalar",
        "type": "Boolean",
        "column": "titleOn",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "titleSize",
        "kind": "scalar",
        "type": "Int",
        "column": "titleSize",
        "default": {
          "kind": "value",
          "value": 14
        }
      },
      {
        "name": "line1",
        "kind": "scalar",
        "type": "String",
        "column": "line1",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "line1On",
        "kind": "scalar",
        "type": "Boolean",
        "column": "line1On",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "line1Size",
        "kind": "scalar",
        "type": "Int",
        "column": "line1Size",
        "default": {
          "kind": "value",
          "value": 10
        }
      },
      {
        "name": "line2",
        "kind": "scalar",
        "type": "String",
        "column": "line2",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "line2On",
        "kind": "scalar",
        "type": "Boolean",
        "column": "line2On",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "line2Size",
        "kind": "scalar",
        "type": "Int",
        "column": "line2Size",
        "default": {
          "kind": "value",
          "value": 10
        }
      },
      {
        "name": "line3",
        "kind": "scalar",
        "type": "String",
        "column": "line3",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "line3On",
        "kind": "scalar",
        "type": "Boolean",
        "column": "line3On",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "line3Size",
        "kind": "scalar",
        "type": "Int",
        "column": "line3Size",
        "default": {
          "kind": "value",
          "value": 10
        }
      },
      {
        "name": "line4",
        "kind": "scalar",
        "type": "String",
        "column": "line4",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "line4On",
        "kind": "scalar",
        "type": "Boolean",
        "column": "line4On",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "line4Size",
        "kind": "scalar",
        "type": "Int",
        "column": "line4Size",
        "default": {
          "kind": "value",
          "value": 10
        }
      },
      {
        "name": "line5",
        "kind": "scalar",
        "type": "String",
        "column": "line5",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "line5On",
        "kind": "scalar",
        "type": "Boolean",
        "column": "line5On",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "line5Size",
        "kind": "scalar",
        "type": "Int",
        "column": "line5Size",
        "default": {
          "kind": "value",
          "value": 10
        }
      },
      {
        "name": "line6",
        "kind": "scalar",
        "type": "String",
        "column": "line6",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "line6On",
        "kind": "scalar",
        "type": "Boolean",
        "column": "line6On",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "line6Size",
        "kind": "scalar",
        "type": "Int",
        "column": "line6Size",
        "default": {
          "kind": "value",
          "value": 10
        }
      },
      {
        "name": "url",
        "kind": "scalar",
        "type": "String",
        "column": "url",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "showBarcode",
        "kind": "scalar",
        "type": "Boolean",
        "column": "showBarcode",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "barcode",
        "kind": "scalar",
        "type": "String",
        "column": "barcode",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "SettingStore": {
    "table": "SettingStore",
    "delegate": "settingStore",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "namestore",
        "kind": "scalar",
        "type": "String",
        "column": "namestore",
        "isOptional": true,
        "isUnique": true
      },
      {
        "name": "address",
        "kind": "scalar",
        "type": "String",
        "column": "address",
        "isOptional": true
      },
      {
        "name": "tel",
        "kind": "scalar",
        "type": "String",
        "column": "tel",
        "isOptional": true
      },
      {
        "name": "lineid",
        "kind": "scalar",
        "type": "String",
        "column": "lineid",
        "isOptional": true
      },
      {
        "name": "ownerName",
        "kind": "scalar",
        "type": "String",
        "column": "ownerName",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "taxnumber",
        "kind": "scalar",
        "type": "String",
        "column": "taxnumber",
        "isOptional": true
      },
      {
        "name": "publiclogo",
        "kind": "scalar",
        "type": "String",
        "column": "publiclogo",
        "isOptional": true,
        "isUnique": true
      },
      {
        "name": "publicline",
        "kind": "scalar",
        "type": "String",
        "column": "publicline",
        "isOptional": true,
        "isUnique": true
      },
      {
        "name": "vatEnabled",
        "kind": "scalar",
        "type": "String",
        "column": "vatEnabled",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "false"
        }
      },
      {
        "name": "vatRate",
        "kind": "scalar",
        "type": "Float",
        "column": "vatRate",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 7
        }
      },
      {
        "name": "branchName",
        "kind": "scalar",
        "type": "String",
        "column": "branchName",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "branchCode",
        "kind": "scalar",
        "type": "String",
        "column": "branchCode",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "blockNegativeStockSale",
        "kind": "scalar",
        "type": "String",
        "column": "blockNegativeStockSale",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "false"
        }
      },
      {
        "name": "expiryColorRules",
        "kind": "scalar",
        "type": "String",
        "column": "expiryColorRules",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "[]"
        }
      },
      {
        "name": "costPriceMode",
        "kind": "scalar",
        "type": "String",
        "column": "costPriceMode",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "latest"
        }
      }
    ]
  },
  "SettingLabel": {
    "table": "SettingLabel",
    "delegate": "settingLabel",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "logo",
        "kind": "scalar",
        "type": "String",
        "column": "logo",
        "isOptional": true
      },
      {
        "name": "line",
        "kind": "scalar",
        "type": "String",
        "column": "line",
        "isOptional": true
      },
      {
        "name": "all",
        "kind": "scalar",
        "type": "String",
        "column": "all",
        "isOptional": true
      }
    ]
  },
  "Settingpoint": {
    "table": "Settingpoint",
    "delegate": "settingpoint",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "sale",
        "kind": "scalar",
        "type": "Int",
        "column": "sale",
        "isOptional": true
      },
      {
        "name": "pointeq",
        "kind": "scalar",
        "type": "Int",
        "column": "pointeq",
        "isOptional": true
      },
      {
        "name": "pointset",
        "kind": "scalar",
        "type": "Int",
        "column": "pointset",
        "isOptional": true
      },
      {
        "name": "discount",
        "kind": "scalar",
        "type": "Int",
        "column": "discount",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true
      },
      {
        "name": "memberDiscountPercent",
        "kind": "scalar",
        "type": "Float",
        "column": "memberDiscountPercent",
        "default": {
          "kind": "value",
          "value": 2
        }
      },
      {
        "name": "memberDiscountEnabled",
        "kind": "scalar",
        "type": "Boolean",
        "column": "memberDiscountEnabled",
        "default": {
          "kind": "value",
          "value": false
        }
      }
    ]
  },
  "Settingpayment": {
    "table": "Settingpayment",
    "delegate": "settingpayment",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "bank",
        "kind": "scalar",
        "type": "String",
        "column": "bank",
        "isOptional": true
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name",
        "isOptional": true
      },
      {
        "name": "bookbankno",
        "kind": "scalar",
        "type": "String",
        "column": "bookbankno",
        "isOptional": true
      },
      {
        "name": "promtpayno",
        "kind": "scalar",
        "type": "String",
        "column": "promtpayno",
        "isOptional": true
      },
      {
        "name": "publicId",
        "kind": "scalar",
        "type": "String",
        "column": "publicId",
        "isOptional": true,
        "isUnique": true
      }
    ]
  },
  "ReportWorkShift": {
    "table": "ReportWorkShift",
    "delegate": "reportWorkShift",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company"
      },
      {
        "name": "shiftKey",
        "kind": "scalar",
        "type": "String",
        "column": "shiftKey"
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name"
      },
      {
        "name": "startTime",
        "kind": "scalar",
        "type": "String",
        "column": "startTime"
      },
      {
        "name": "endTime",
        "kind": "scalar",
        "type": "String",
        "column": "endTime"
      },
      {
        "name": "sortOrder",
        "kind": "scalar",
        "type": "Int",
        "column": "sortOrder",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "PaymentProvider": {
    "table": "PaymentProvider",
    "delegate": "paymentProvider",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "provider",
        "kind": "scalar",
        "type": "String",
        "column": "provider"
      },
      {
        "name": "enabled",
        "kind": "scalar",
        "type": "Boolean",
        "column": "enabled",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "displayName",
        "kind": "scalar",
        "type": "String",
        "column": "displayName",
        "isOptional": true
      },
      {
        "name": "apiKey",
        "kind": "scalar",
        "type": "String",
        "column": "apiKey",
        "isOptional": true
      },
      {
        "name": "secretKey",
        "kind": "scalar",
        "type": "String",
        "column": "secretKey",
        "isOptional": true
      },
      {
        "name": "merchantId",
        "kind": "scalar",
        "type": "String",
        "column": "merchantId",
        "isOptional": true
      },
      {
        "name": "accountId",
        "kind": "scalar",
        "type": "String",
        "column": "accountId",
        "isOptional": true
      },
      {
        "name": "qrImageUrl",
        "kind": "scalar",
        "type": "String",
        "column": "qrImageUrl",
        "isOptional": true
      },
      {
        "name": "webhookUrl",
        "kind": "scalar",
        "type": "String",
        "column": "webhookUrl",
        "isOptional": true
      },
      {
        "name": "serviceChargePercent",
        "kind": "scalar",
        "type": "Float",
        "column": "serviceChargePercent",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "PaymentTransaction": {
    "table": "PaymentTransaction",
    "delegate": "paymentTransaction",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "txId",
        "kind": "scalar",
        "type": "String",
        "column": "txId",
        "isUnique": true,
        "default": {
          "kind": "uuid"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "provider",
        "kind": "scalar",
        "type": "String",
        "column": "provider",
        "isOptional": true
      },
      {
        "name": "amount",
        "kind": "scalar",
        "type": "Float",
        "column": "amount",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "pending"
        }
      },
      {
        "name": "reference",
        "kind": "scalar",
        "type": "String",
        "column": "reference",
        "isOptional": true
      },
      {
        "name": "saleId",
        "kind": "scalar",
        "type": "String",
        "column": "saleId",
        "isOptional": true
      },
      {
        "name": "qrPayload",
        "kind": "scalar",
        "type": "String",
        "column": "qrPayload",
        "isOptional": true
      },
      {
        "name": "rawPayload",
        "kind": "scalar",
        "type": "String",
        "column": "rawPayload",
        "isOptional": true
      },
      {
        "name": "paidAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "paidAt",
        "isOptional": true
      },
      {
        "name": "expiresAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "expiresAt",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "Promotion": {
    "table": "Promotion",
    "delegate": "promotion",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "name_promotion",
        "kind": "scalar",
        "type": "String",
        "column": "name_promotion",
        "isOptional": true
      },
      {
        "name": "customer",
        "kind": "scalar",
        "type": "String",
        "column": "customer",
        "isOptional": true
      },
      {
        "name": "conditionid",
        "kind": "scalar",
        "type": "Int",
        "column": "conditionid",
        "isOptional": true
      },
      {
        "name": "condition",
        "kind": "scalar",
        "type": "String",
        "column": "condition",
        "isOptional": true
      },
      {
        "name": "startdate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "startdate",
        "isOptional": true
      },
      {
        "name": "enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "enddate",
        "isOptional": true
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true
      },
      {
        "name": "pay_condition",
        "kind": "scalar",
        "type": "Int",
        "column": "pay_condition",
        "isOptional": true
      },
      {
        "name": "discount",
        "kind": "scalar",
        "type": "Int",
        "column": "discount",
        "isOptional": true
      },
      {
        "name": "msg_condition",
        "kind": "scalar",
        "type": "String",
        "column": "msg_condition",
        "isOptional": true
      },
      {
        "name": "msg_discount",
        "kind": "scalar",
        "type": "String",
        "column": "msg_discount",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      }
    ]
  },
  "ProductPromotion": {
    "table": "ProductPromotion",
    "delegate": "productPromotion",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name",
        "isOptional": true
      },
      {
        "name": "id_product",
        "kind": "scalar",
        "type": "Int",
        "column": "id_product",
        "isOptional": true
      },
      {
        "name": "code_product",
        "kind": "scalar",
        "type": "String",
        "column": "code_product",
        "isOptional": true
      },
      {
        "name": "name_product",
        "kind": "scalar",
        "type": "String",
        "column": "name_product",
        "isOptional": true
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true
      },
      {
        "name": "price_tier",
        "kind": "scalar",
        "type": "String",
        "column": "price_tier",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "ทุกระดับราคา"
        }
      },
      {
        "name": "promo_type",
        "kind": "scalar",
        "type": "String",
        "column": "promo_type",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "discount"
        }
      },
      {
        "name": "min_qty",
        "kind": "scalar",
        "type": "Float",
        "column": "min_qty",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "discount_unit",
        "kind": "scalar",
        "type": "String",
        "column": "discount_unit",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "baht"
        }
      },
      {
        "name": "discount_scope",
        "kind": "scalar",
        "type": "String",
        "column": "discount_scope",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "unit"
        }
      },
      {
        "name": "discount_value",
        "kind": "scalar",
        "type": "Float",
        "column": "discount_value",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "free_qty",
        "kind": "scalar",
        "type": "Float",
        "column": "free_qty",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "startdate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "startdate",
        "isOptional": true
      },
      {
        "name": "enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "enddate",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "active"
        }
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "Label_language": {
    "table": "Label_language",
    "delegate": "label_language",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true
      },
      {
        "name": "list_lo",
        "kind": "scalar",
        "type": "String",
        "column": "list_lo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_my",
        "kind": "scalar",
        "type": "String",
        "column": "list_my",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_km",
        "kind": "scalar",
        "type": "String",
        "column": "list_km",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_zh",
        "kind": "scalar",
        "type": "String",
        "column": "list_zh",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list_eng",
        "kind": "scalar",
        "type": "String",
        "column": "list_eng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "DocMain": {
    "table": "DocMain",
    "delegate": "docMain",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "id_costomer",
        "kind": "scalar",
        "type": "Int",
        "column": "id_costomer",
        "isOptional": true
      },
      {
        "name": "code_costomer",
        "kind": "scalar",
        "type": "String",
        "column": "code_costomer",
        "isOptional": true
      },
      {
        "name": "name_costomer",
        "kind": "scalar",
        "type": "String",
        "column": "name_costomer",
        "isOptional": true
      },
      {
        "name": "group_price",
        "kind": "scalar",
        "type": "String",
        "column": "group_price",
        "isOptional": true
      },
      {
        "name": "pay",
        "kind": "scalar",
        "type": "String",
        "column": "pay",
        "isOptional": true
      },
      {
        "name": "bill",
        "kind": "scalar",
        "type": "Int",
        "column": "bill",
        "isOptional": true
      },
      {
        "name": "discount",
        "kind": "scalar",
        "type": "Float",
        "column": "discount",
        "isOptional": true
      },
      {
        "name": "sumtotal",
        "kind": "scalar",
        "type": "Float",
        "column": "sumtotal",
        "isOptional": true
      },
      {
        "name": "addreward",
        "kind": "scalar",
        "type": "Float",
        "column": "addreward",
        "isOptional": true
      },
      {
        "name": "usereward",
        "kind": "scalar",
        "type": "Float",
        "column": "usereward",
        "isOptional": true
      },
      {
        "name": "companyall",
        "kind": "scalar",
        "type": "String",
        "column": "companyall",
        "isOptional": true
      },
      {
        "name": "personall",
        "kind": "scalar",
        "type": "String",
        "column": "personall",
        "isOptional": true
      },
      {
        "name": "statussall",
        "kind": "scalar",
        "type": "String",
        "column": "statussall",
        "isOptional": true
      },
      {
        "name": "totalall",
        "kind": "scalar",
        "type": "Float",
        "column": "totalall",
        "isOptional": true
      },
      {
        "name": "taxnumber",
        "kind": "scalar",
        "type": "String",
        "column": "taxnumber",
        "isOptional": true
      },
      {
        "name": "qt_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "qt_date",
        "isOptional": true
      },
      {
        "name": "qt_enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "qt_enddate",
        "isOptional": true
      },
      {
        "name": "qt_credit",
        "kind": "scalar",
        "type": "Int",
        "column": "qt_credit",
        "isOptional": true
      },
      {
        "name": "qt_number",
        "kind": "scalar",
        "type": "Int",
        "column": "qt_number",
        "isOptional": true
      },
      {
        "name": "qt_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "qt_orderNo",
        "isOptional": true
      },
      {
        "name": "qt_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "qt_orderfull",
        "isOptional": true
      },
      {
        "name": "qt_status",
        "kind": "scalar",
        "type": "String",
        "column": "qt_status",
        "isOptional": true
      },
      {
        "name": "qt_person",
        "kind": "scalar",
        "type": "String",
        "column": "qt_person",
        "isOptional": true
      },
      {
        "name": "qt_remark",
        "kind": "scalar",
        "type": "String",
        "column": "qt_remark",
        "isOptional": true
      },
      {
        "name": "bl_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "bl_date",
        "isOptional": true
      },
      {
        "name": "bl_enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "bl_enddate",
        "isOptional": true
      },
      {
        "name": "bl_number",
        "kind": "scalar",
        "type": "Int",
        "column": "bl_number",
        "isOptional": true
      },
      {
        "name": "bl_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "bl_orderNo",
        "isOptional": true
      },
      {
        "name": "bl_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "bl_orderfull",
        "isOptional": true
      },
      {
        "name": "bl_status",
        "kind": "scalar",
        "type": "String",
        "column": "bl_status",
        "isOptional": true
      },
      {
        "name": "bl_credit",
        "kind": "scalar",
        "type": "Int",
        "column": "bl_credit",
        "isOptional": true
      },
      {
        "name": "bl_person",
        "kind": "scalar",
        "type": "String",
        "column": "bl_person",
        "isOptional": true
      },
      {
        "name": "bl_remark",
        "kind": "scalar",
        "type": "String",
        "column": "bl_remark",
        "isOptional": true
      },
      {
        "name": "inv_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "inv_date",
        "isOptional": true
      },
      {
        "name": "inv_enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "inv_enddate",
        "isOptional": true
      },
      {
        "name": "inv_number",
        "kind": "scalar",
        "type": "Int",
        "column": "inv_number",
        "isOptional": true
      },
      {
        "name": "inv_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "inv_orderNo",
        "isOptional": true
      },
      {
        "name": "inv_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "inv_orderfull",
        "isOptional": true
      },
      {
        "name": "inv_status",
        "kind": "scalar",
        "type": "String",
        "column": "inv_status",
        "isOptional": true
      },
      {
        "name": "inv_credit",
        "kind": "scalar",
        "type": "Int",
        "column": "inv_credit",
        "isOptional": true
      },
      {
        "name": "inv_person",
        "kind": "scalar",
        "type": "String",
        "column": "inv_person",
        "isOptional": true
      },
      {
        "name": "inv_remark",
        "kind": "scalar",
        "type": "String",
        "column": "inv_remark",
        "isOptional": true
      },
      {
        "name": "re_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "re_date",
        "isOptional": true
      },
      {
        "name": "re_enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "re_enddate",
        "isOptional": true
      },
      {
        "name": "re_number",
        "kind": "scalar",
        "type": "Int",
        "column": "re_number",
        "isOptional": true
      },
      {
        "name": "re_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "re_orderNo",
        "isOptional": true
      },
      {
        "name": "re_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "re_orderfull",
        "isOptional": true
      },
      {
        "name": "re_status",
        "kind": "scalar",
        "type": "String",
        "column": "re_status",
        "isOptional": true
      },
      {
        "name": "re_credit",
        "kind": "scalar",
        "type": "Int",
        "column": "re_credit",
        "isOptional": true
      },
      {
        "name": "re_person",
        "kind": "scalar",
        "type": "String",
        "column": "re_person",
        "isOptional": true
      },
      {
        "name": "re_remark",
        "kind": "scalar",
        "type": "String",
        "column": "re_remark",
        "isOptional": true
      },
      {
        "name": "dn_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "dn_date",
        "isOptional": true
      },
      {
        "name": "dn_enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "dn_enddate",
        "isOptional": true
      },
      {
        "name": "dn_number",
        "kind": "scalar",
        "type": "Int",
        "column": "dn_number",
        "isOptional": true
      },
      {
        "name": "dn_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "dn_orderNo",
        "isOptional": true
      },
      {
        "name": "dn_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "dn_orderfull",
        "isOptional": true
      },
      {
        "name": "dn_status",
        "kind": "scalar",
        "type": "String",
        "column": "dn_status",
        "isOptional": true
      },
      {
        "name": "dn_credit",
        "kind": "scalar",
        "type": "Int",
        "column": "dn_credit",
        "isOptional": true
      },
      {
        "name": "dn_person",
        "kind": "scalar",
        "type": "String",
        "column": "dn_person",
        "isOptional": true
      },
      {
        "name": "dn_remark",
        "kind": "scalar",
        "type": "String",
        "column": "dn_remark",
        "isOptional": true
      },
      {
        "name": "dn_paytype",
        "kind": "scalar",
        "type": "String",
        "column": "dn_paytype",
        "isOptional": true
      },
      {
        "name": "dn_deposit",
        "kind": "scalar",
        "type": "Float",
        "column": "dn_deposit",
        "isOptional": true
      },
      {
        "name": "dn_balance",
        "kind": "scalar",
        "type": "Float",
        "column": "dn_balance",
        "isOptional": true
      },
      {
        "name": "tax_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "tax_date",
        "isOptional": true
      },
      {
        "name": "tax_enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "tax_enddate",
        "isOptional": true
      },
      {
        "name": "tax_number",
        "kind": "scalar",
        "type": "Int",
        "column": "tax_number",
        "isOptional": true
      },
      {
        "name": "tax_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "tax_orderNo",
        "isOptional": true
      },
      {
        "name": "tax_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "tax_orderfull",
        "isOptional": true
      },
      {
        "name": "tax_status",
        "kind": "scalar",
        "type": "String",
        "column": "tax_status",
        "isOptional": true
      },
      {
        "name": "tax_credit",
        "kind": "scalar",
        "type": "Int",
        "column": "tax_credit",
        "isOptional": true
      },
      {
        "name": "tax_person",
        "kind": "scalar",
        "type": "String",
        "column": "tax_person",
        "isOptional": true
      },
      {
        "name": "tax_remark",
        "kind": "scalar",
        "type": "String",
        "column": "tax_remark",
        "isOptional": true
      },
      {
        "name": "debit_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "debit_date",
        "isOptional": true
      },
      {
        "name": "debit_enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "debit_enddate",
        "isOptional": true
      },
      {
        "name": "debit_number",
        "kind": "scalar",
        "type": "Int",
        "column": "debit_number",
        "isOptional": true
      },
      {
        "name": "debit_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "debit_orderNo",
        "isOptional": true
      },
      {
        "name": "debit_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "debit_orderfull",
        "isOptional": true
      },
      {
        "name": "debit_status",
        "kind": "scalar",
        "type": "String",
        "column": "debit_status",
        "isOptional": true
      },
      {
        "name": "debit_credit",
        "kind": "scalar",
        "type": "Int",
        "column": "debit_credit",
        "isOptional": true
      },
      {
        "name": "debit_person",
        "kind": "scalar",
        "type": "String",
        "column": "debit_person",
        "isOptional": true
      },
      {
        "name": "debit_remark",
        "kind": "scalar",
        "type": "String",
        "column": "debit_remark",
        "isOptional": true
      },
      {
        "name": "debit_reference_no",
        "kind": "scalar",
        "type": "String",
        "column": "debit_reference_no",
        "isOptional": true
      },
      {
        "name": "debit_reason",
        "kind": "scalar",
        "type": "String",
        "column": "debit_reason",
        "isOptional": true
      },
      {
        "name": "debit_original_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "debit_original_amount",
        "isOptional": true
      },
      {
        "name": "debit_correct_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "debit_correct_amount",
        "isOptional": true
      },
      {
        "name": "debit_difference_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "debit_difference_amount",
        "isOptional": true
      },
      {
        "name": "debit_vat_rate",
        "kind": "scalar",
        "type": "Int",
        "column": "debit_vat_rate",
        "isOptional": true
      },
      {
        "name": "debit_vat_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "debit_vat_amount",
        "isOptional": true
      },
      {
        "name": "debit_grand_total",
        "kind": "scalar",
        "type": "Float",
        "column": "debit_grand_total",
        "isOptional": true
      },
      {
        "name": "credit_date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "credit_date",
        "isOptional": true
      },
      {
        "name": "credit_enddate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "credit_enddate",
        "isOptional": true
      },
      {
        "name": "credit_number",
        "kind": "scalar",
        "type": "Int",
        "column": "credit_number",
        "isOptional": true
      },
      {
        "name": "credit_orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "credit_orderNo",
        "isOptional": true
      },
      {
        "name": "credit_orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "credit_orderfull",
        "isOptional": true
      },
      {
        "name": "credit_status",
        "kind": "scalar",
        "type": "String",
        "column": "credit_status",
        "isOptional": true
      },
      {
        "name": "credit_credit",
        "kind": "scalar",
        "type": "Int",
        "column": "credit_credit",
        "isOptional": true
      },
      {
        "name": "credit_person",
        "kind": "scalar",
        "type": "String",
        "column": "credit_person",
        "isOptional": true
      },
      {
        "name": "credit_remark",
        "kind": "scalar",
        "type": "String",
        "column": "credit_remark",
        "isOptional": true
      },
      {
        "name": "credit_reference_no",
        "kind": "scalar",
        "type": "String",
        "column": "credit_reference_no",
        "isOptional": true
      },
      {
        "name": "credit_reference_book_no",
        "kind": "scalar",
        "type": "String",
        "column": "credit_reference_book_no",
        "isOptional": true
      },
      {
        "name": "credit_reason",
        "kind": "scalar",
        "type": "String",
        "column": "credit_reason",
        "isOptional": true
      },
      {
        "name": "credit_item_name",
        "kind": "scalar",
        "type": "String",
        "column": "credit_item_name",
        "isOptional": true
      },
      {
        "name": "credit_item_qty",
        "kind": "scalar",
        "type": "Float",
        "column": "credit_item_qty",
        "isOptional": true
      },
      {
        "name": "credit_items_json",
        "kind": "scalar",
        "type": "Json",
        "column": "credit_items_json",
        "isOptional": true
      },
      {
        "name": "credit_original_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "credit_original_amount",
        "isOptional": true
      },
      {
        "name": "credit_correct_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "credit_correct_amount",
        "isOptional": true
      },
      {
        "name": "credit_difference_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "credit_difference_amount",
        "isOptional": true
      },
      {
        "name": "credit_reduce_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "credit_reduce_amount",
        "isOptional": true
      },
      {
        "name": "credit_vat_rate",
        "kind": "scalar",
        "type": "Int",
        "column": "credit_vat_rate",
        "isOptional": true
      },
      {
        "name": "credit_vat_amount",
        "kind": "scalar",
        "type": "Float",
        "column": "credit_vat_amount",
        "isOptional": true
      },
      {
        "name": "credit_net_total",
        "kind": "scalar",
        "type": "Float",
        "column": "credit_net_total",
        "isOptional": true
      },
      {
        "name": "detailsale",
        "kind": "relation",
        "type": "DocDetail",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "id_docmain"
        ]
      }
    ]
  },
  "DocDetail": {
    "table": "DocDetail",
    "delegate": "docDetail",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "id_product",
        "kind": "scalar",
        "type": "Int",
        "column": "id_product",
        "isOptional": true
      },
      {
        "name": "code_product",
        "kind": "scalar",
        "type": "String",
        "column": "code_product",
        "isOptional": true
      },
      {
        "name": "name_product",
        "kind": "scalar",
        "type": "String",
        "column": "name_product",
        "isOptional": true
      },
      {
        "name": "cetagory",
        "kind": "scalar",
        "type": "String",
        "column": "cetagory",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Float",
        "column": "qty",
        "isOptional": true
      },
      {
        "name": "cost",
        "kind": "scalar",
        "type": "Float",
        "column": "cost",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "price",
        "kind": "scalar",
        "type": "Float",
        "column": "price",
        "isOptional": true
      },
      {
        "name": "discount",
        "kind": "scalar",
        "type": "Float",
        "column": "discount",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "total",
        "kind": "scalar",
        "type": "Float",
        "column": "total",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "statuss",
        "kind": "scalar",
        "type": "String",
        "column": "statuss",
        "isOptional": true
      },
      {
        "name": "id_docmain",
        "kind": "scalar",
        "type": "Int",
        "column": "id_docmain"
      },
      {
        "name": "docmain",
        "kind": "relation",
        "type": "DocMain",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "id_docmain"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "PL": {
    "table": "PL",
    "delegate": "pL",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "month",
        "kind": "scalar",
        "type": "String",
        "column": "month",
        "isOptional": true
      },
      {
        "name": "year",
        "kind": "scalar",
        "type": "String",
        "column": "year",
        "isOptional": true
      },
      {
        "name": "monthyear",
        "kind": "scalar",
        "type": "String",
        "column": "monthyear",
        "isOptional": true
      },
      {
        "name": "R4000",
        "kind": "scalar",
        "type": "Float",
        "column": "R4000",
        "isOptional": true
      },
      {
        "name": "R4001",
        "kind": "scalar",
        "type": "Float",
        "column": "R4001",
        "isOptional": true
      },
      {
        "name": "R4002",
        "kind": "scalar",
        "type": "Float",
        "column": "R4002",
        "isOptional": true
      },
      {
        "name": "C5000",
        "kind": "scalar",
        "type": "Float",
        "column": "C5000",
        "isOptional": true
      },
      {
        "name": "C5001",
        "kind": "scalar",
        "type": "Float",
        "column": "C5001",
        "isOptional": true
      },
      {
        "name": "S6000",
        "kind": "scalar",
        "type": "Float",
        "column": "S6000",
        "isOptional": true
      },
      {
        "name": "S6001",
        "kind": "scalar",
        "type": "Float",
        "column": "S6001",
        "isOptional": true
      },
      {
        "name": "S6002",
        "kind": "scalar",
        "type": "Float",
        "column": "S6002",
        "isOptional": true
      },
      {
        "name": "S6003",
        "kind": "scalar",
        "type": "Float",
        "column": "S6003",
        "isOptional": true
      },
      {
        "name": "S6004",
        "kind": "scalar",
        "type": "Float",
        "column": "S6004",
        "isOptional": true
      },
      {
        "name": "S6005",
        "kind": "scalar",
        "type": "Float",
        "column": "S6005",
        "isOptional": true
      },
      {
        "name": "S6006",
        "kind": "scalar",
        "type": "Float",
        "column": "S6006",
        "isOptional": true
      },
      {
        "name": "S6007",
        "kind": "scalar",
        "type": "Float",
        "column": "S6007",
        "isOptional": true
      },
      {
        "name": "S6008",
        "kind": "scalar",
        "type": "Float",
        "column": "S6008",
        "isOptional": true
      },
      {
        "name": "S6009",
        "kind": "scalar",
        "type": "Float",
        "column": "S6009",
        "isOptional": true
      },
      {
        "name": "S6010",
        "kind": "scalar",
        "type": "Float",
        "column": "S6010",
        "isOptional": true
      },
      {
        "name": "A7000",
        "kind": "scalar",
        "type": "Float",
        "column": "A7000",
        "isOptional": true
      },
      {
        "name": "A7001",
        "kind": "scalar",
        "type": "Float",
        "column": "A7001",
        "isOptional": true
      },
      {
        "name": "A7002",
        "kind": "scalar",
        "type": "Float",
        "column": "A7002",
        "isOptional": true
      },
      {
        "name": "A7003",
        "kind": "scalar",
        "type": "Float",
        "column": "A7003",
        "isOptional": true
      },
      {
        "name": "A7004",
        "kind": "scalar",
        "type": "Float",
        "column": "A7004",
        "isOptional": true
      },
      {
        "name": "A7005",
        "kind": "scalar",
        "type": "Float",
        "column": "A7005",
        "isOptional": true
      },
      {
        "name": "A7006",
        "kind": "scalar",
        "type": "Float",
        "column": "A7006",
        "isOptional": true
      },
      {
        "name": "A7007",
        "kind": "scalar",
        "type": "Float",
        "column": "A7007",
        "isOptional": true
      },
      {
        "name": "vat",
        "kind": "scalar",
        "type": "Float",
        "column": "vat",
        "isOptional": true
      }
    ]
  },
  "Interaction": {
    "table": "Interaction",
    "delegate": "interaction",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "fixname1",
        "kind": "scalar",
        "type": "String",
        "column": "fixname1",
        "isOptional": true
      },
      {
        "name": "fixname2",
        "kind": "scalar",
        "type": "String",
        "column": "fixname2",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true
      }
    ]
  },
  "Level": {
    "table": "Level",
    "delegate": "level",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "mainlevel",
        "kind": "relation",
        "type": "MainLevel",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "levelId"
        ]
      }
    ]
  },
  "MainLevel": {
    "table": "MainLevel",
    "delegate": "mainLevel",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "codename",
        "kind": "scalar",
        "type": "String",
        "column": "codename",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "main",
        "kind": "scalar",
        "type": "String",
        "column": "main",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "list",
        "kind": "scalar",
        "type": "String",
        "column": "list",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "level1",
        "kind": "scalar",
        "type": "Boolean",
        "column": "level1",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "level2",
        "kind": "scalar",
        "type": "Boolean",
        "column": "level2",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "level3",
        "kind": "scalar",
        "type": "Boolean",
        "column": "level3",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "levelId",
        "kind": "scalar",
        "type": "Int",
        "column": "levelId"
      },
      {
        "name": "level",
        "kind": "relation",
        "type": "Level",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "levelId"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "EmployeePermission": {
    "table": "EmployeePermission",
    "delegate": "employeePermission",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "employeeId",
        "kind": "scalar",
        "type": "Int",
        "column": "employeeId"
      },
      {
        "name": "codename",
        "kind": "scalar",
        "type": "String",
        "column": "codename"
      },
      {
        "name": "allowed",
        "kind": "scalar",
        "type": "Boolean",
        "column": "allowed",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "employee",
        "kind": "relation",
        "type": "SettingEmployee",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "employeeId"
        ],
        "toFields": [
          "id"
        ],
        "onDelete": "Cascade"
      }
    ]
  },
  "Checkin": {
    "table": "Checkin",
    "delegate": "checkin",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "idcompany",
        "kind": "scalar",
        "type": "String",
        "column": "idcompany",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "personId",
        "kind": "scalar",
        "type": "Int",
        "column": "personId",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "checkin",
        "kind": "scalar",
        "type": "DateTime",
        "column": "checkin",
        "isOptional": true
      },
      {
        "name": "checkout",
        "kind": "scalar",
        "type": "DateTime",
        "column": "checkout",
        "isOptional": true
      },
      {
        "name": "checkinLat",
        "kind": "scalar",
        "type": "Float",
        "column": "checkinLat",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "checkinLng",
        "kind": "scalar",
        "type": "Float",
        "column": "checkinLng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "checkoutLat",
        "kind": "scalar",
        "type": "Float",
        "column": "checkoutLat",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "checkoutLng",
        "kind": "scalar",
        "type": "Float",
        "column": "checkoutLng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "gpsRadius",
        "kind": "scalar",
        "type": "Float",
        "column": "gpsRadius",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 10
        }
      },
      {
        "name": "targetLat",
        "kind": "scalar",
        "type": "Float",
        "column": "targetLat",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "targetLng",
        "kind": "scalar",
        "type": "Float",
        "column": "targetLng",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "approve",
        "kind": "scalar",
        "type": "String",
        "column": "approve",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "approveDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "approveDate",
        "isOptional": true
      },
      {
        "name": "approvePerson",
        "kind": "scalar",
        "type": "String",
        "column": "approvePerson",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "remark",
        "kind": "scalar",
        "type": "String",
        "column": "remark",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "CheckinSet": {
    "table": "CheckinSet",
    "delegate": "checkinSet",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "idcompany",
        "kind": "scalar",
        "type": "String",
        "column": "idcompany",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "names",
        "kind": "scalar",
        "type": "String",
        "column": "names",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "radius",
        "kind": "scalar",
        "type": "Float",
        "column": "radius",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 100
        }
      },
      {
        "name": "latitude",
        "kind": "scalar",
        "type": "Float",
        "column": "latitude",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "longitude",
        "kind": "scalar",
        "type": "Float",
        "column": "longitude",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "CheckinDevice": {
    "table": "CheckinDevice",
    "delegate": "checkinDevice",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "idcompany",
        "kind": "scalar",
        "type": "String",
        "column": "idcompany",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "deviceId",
        "kind": "scalar",
        "type": "String",
        "column": "deviceId",
        "isUnique": true
      },
      {
        "name": "name",
        "kind": "scalar",
        "type": "String",
        "column": "name",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "branch",
        "kind": "scalar",
        "type": "String",
        "column": "branch",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "deviceType",
        "kind": "scalar",
        "type": "String",
        "column": "deviceType",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "Web"
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "active"
        }
      },
      {
        "name": "registeredBy",
        "kind": "scalar",
        "type": "String",
        "column": "registeredBy",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "Checkstock": {
    "table": "Checkstock",
    "delegate": "checkstock",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "date",
        "kind": "scalar",
        "type": "DateTime",
        "column": "date",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "month",
        "kind": "scalar",
        "type": "String",
        "column": "month",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "idcompany",
        "kind": "scalar",
        "type": "String",
        "column": "idcompany",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "id_product",
        "kind": "scalar",
        "type": "Int",
        "column": "id_product",
        "isOptional": true
      },
      {
        "name": "name_product",
        "kind": "scalar",
        "type": "String",
        "column": "name_product",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "balance",
        "kind": "scalar",
        "type": "Float",
        "column": "balance",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "actual",
        "kind": "scalar",
        "type": "Float",
        "column": "actual",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "diff",
        "kind": "scalar",
        "type": "Float",
        "column": "diff",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "RCstockchange": {
    "table": "RCstockchange",
    "delegate": "rCstockchange",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "codenames",
        "kind": "scalar",
        "type": "String",
        "column": "codenames",
        "isOptional": true
      },
      {
        "name": "itemcode",
        "kind": "scalar",
        "type": "String",
        "column": "itemcode",
        "isOptional": true
      },
      {
        "name": "itemName",
        "kind": "scalar",
        "type": "String",
        "column": "itemName",
        "isOptional": true
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "newCost",
        "kind": "scalar",
        "type": "Float",
        "column": "newCost",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Float",
        "column": "qty",
        "isOptional": true
      },
      {
        "name": "totalcost",
        "kind": "scalar",
        "type": "Float",
        "column": "totalcost",
        "isOptional": true
      },
      {
        "name": "lot",
        "kind": "scalar",
        "type": "String",
        "column": "lot",
        "isOptional": true
      },
      {
        "name": "dateExp",
        "kind": "scalar",
        "type": "DateTime",
        "column": "dateExp",
        "isOptional": true
      },
      {
        "name": "freebaht",
        "kind": "scalar",
        "type": "Float",
        "column": "freebaht",
        "isOptional": true
      },
      {
        "name": "discountbaht",
        "kind": "scalar",
        "type": "Float",
        "column": "discountbaht",
        "isOptional": true
      },
      {
        "name": "sale",
        "kind": "scalar",
        "type": "Float",
        "column": "sale",
        "isOptional": true
      },
      {
        "name": "Barcode",
        "kind": "scalar",
        "type": "String",
        "column": "Barcode",
        "isOptional": true
      },
      {
        "name": "type",
        "kind": "scalar",
        "type": "String",
        "column": "type",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "statuss",
        "kind": "scalar",
        "type": "String",
        "column": "statuss",
        "isOptional": true
      },
      {
        "name": "dateRC",
        "kind": "scalar",
        "type": "DateTime",
        "column": "dateRC",
        "isOptional": true
      },
      {
        "name": "balance",
        "kind": "scalar",
        "type": "Float",
        "column": "balance",
        "isOptional": true
      },
      {
        "name": "codevender",
        "kind": "scalar",
        "type": "String",
        "column": "codevender",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "namevender",
        "kind": "scalar",
        "type": "String",
        "column": "namevender",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "StockTransaction": {
    "table": "StockTransaction",
    "delegate": "stockTransaction",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "product_id",
        "kind": "scalar",
        "type": "Int",
        "column": "product_id",
        "isOptional": true
      },
      {
        "name": "inventory_lot_id",
        "kind": "scalar",
        "type": "Int",
        "column": "inventory_lot_id",
        "isOptional": true
      },
      {
        "name": "itemcode",
        "kind": "scalar",
        "type": "String",
        "column": "itemcode",
        "isOptional": true
      },
      {
        "name": "itemName",
        "kind": "scalar",
        "type": "String",
        "column": "itemName",
        "isOptional": true
      },
      {
        "name": "lot",
        "kind": "scalar",
        "type": "String",
        "column": "lot",
        "isOptional": true
      },
      {
        "name": "dateExp",
        "kind": "scalar",
        "type": "DateTime",
        "column": "dateExp",
        "isOptional": true
      },
      {
        "name": "quantity_change",
        "kind": "scalar",
        "type": "Float",
        "column": "quantity_change",
        "isOptional": true
      },
      {
        "name": "balance_after",
        "kind": "scalar",
        "type": "Float",
        "column": "balance_after",
        "isOptional": true
      },
      {
        "name": "transaction_type",
        "kind": "scalar",
        "type": "String",
        "column": "transaction_type",
        "isOptional": true
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "personsale",
        "kind": "scalar",
        "type": "String",
        "column": "personsale",
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "receiverCompany",
        "kind": "scalar",
        "type": "String",
        "column": "receiverCompany",
        "isOptional": true
      },
      {
        "name": "adjustReasonMain",
        "kind": "scalar",
        "type": "String",
        "column": "adjustReasonMain",
        "isOptional": true
      },
      {
        "name": "receiverCompanyName",
        "kind": "scalar",
        "type": "String",
        "column": "receiverCompanyName",
        "isOptional": true
      }
    ]
  },
  "OrderMain": {
    "table": "OrderMain",
    "delegate": "orderMain",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "createDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createDate",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "orderNo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "orderfull",
        "kind": "scalar",
        "type": "String",
        "column": "orderfull",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "supplierId",
        "kind": "scalar",
        "type": "Int",
        "column": "supplierId",
        "isOptional": true
      },
      {
        "name": "supplierCode",
        "kind": "scalar",
        "type": "String",
        "column": "supplierCode",
        "isOptional": true
      },
      {
        "name": "supplierName",
        "kind": "scalar",
        "type": "String",
        "column": "supplierName",
        "isOptional": true
      },
      {
        "name": "totalAmount",
        "kind": "scalar",
        "type": "Float",
        "column": "totalAmount",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "Pending"
        }
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "remark",
        "kind": "scalar",
        "type": "String",
        "column": "remark",
        "isOptional": true
      },
      {
        "name": "items",
        "kind": "relation",
        "type": "OrderDetail",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "orderId"
        ]
      }
    ]
  },
  "OrderDetail": {
    "table": "OrderDetail",
    "delegate": "orderDetail",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "orderId",
        "kind": "scalar",
        "type": "Int",
        "column": "orderId"
      },
      {
        "name": "itemcode",
        "kind": "scalar",
        "type": "String",
        "column": "itemcode",
        "isOptional": true
      },
      {
        "name": "itemName",
        "kind": "scalar",
        "type": "String",
        "column": "itemName",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Float",
        "column": "qty",
        "isOptional": true
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "cost",
        "kind": "scalar",
        "type": "Float",
        "column": "cost",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "total",
        "kind": "scalar",
        "type": "Float",
        "column": "total",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "Pending"
        }
      },
      {
        "name": "orderMain",
        "kind": "relation",
        "type": "OrderMain",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "orderId"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "IncentiveSetting": {
    "table": "IncentiveSetting",
    "delegate": "incentiveSetting",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "targetMonthly",
        "kind": "scalar",
        "type": "Float",
        "column": "targetMonthly",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 300000
        }
      },
      {
        "name": "targetMonthlyBonus",
        "kind": "scalar",
        "type": "Float",
        "column": "targetMonthlyBonus",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 1000
        }
      },
      {
        "name": "targetDaysOver",
        "kind": "scalar",
        "type": "Float",
        "column": "targetDaysOver",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 13
        }
      },
      {
        "name": "targetDaysOverBonus",
        "kind": "scalar",
        "type": "Float",
        "column": "targetDaysOverBonus",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 750
        }
      },
      {
        "name": "targetAmountOver",
        "kind": "scalar",
        "type": "Float",
        "column": "targetAmountOver",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 10000
        }
      },
      {
        "name": "targetAmountOverBonus",
        "kind": "scalar",
        "type": "Float",
        "column": "targetAmountOverBonus",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "targetDaily",
        "kind": "scalar",
        "type": "Float",
        "column": "targetDaily",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 12000
        }
      },
      {
        "name": "targetDailyBonus",
        "kind": "scalar",
        "type": "Float",
        "column": "targetDailyBonus",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 80
        }
      },
      {
        "name": "pickupFeeRate",
        "kind": "scalar",
        "type": "Float",
        "column": "pickupFeeRate",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0.5
        }
      },
      {
        "name": "pickupFeeBonus",
        "kind": "scalar",
        "type": "Float",
        "column": "pickupFeeBonus",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "salesPerBillTarget",
        "kind": "scalar",
        "type": "Float",
        "column": "salesPerBillTarget",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 120
        }
      },
      {
        "name": "salesPerBillBonus",
        "kind": "scalar",
        "type": "Float",
        "column": "salesPerBillBonus",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 20
        }
      },
      {
        "name": "enableTargetMonthly",
        "kind": "scalar",
        "type": "Boolean",
        "column": "enableTargetMonthly",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "enableTargetDaysOver",
        "kind": "scalar",
        "type": "Boolean",
        "column": "enableTargetDaysOver",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "enableTargetDaily",
        "kind": "scalar",
        "type": "Boolean",
        "column": "enableTargetDaily",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "enablePickupFee",
        "kind": "scalar",
        "type": "Boolean",
        "column": "enablePickupFee",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "enableSalesPerBill",
        "kind": "scalar",
        "type": "Boolean",
        "column": "enableSalesPerBill",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "isOptional": true,
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "isOptional": true,
        "updatedAt": true
      }
    ]
  },
  "BranchConnection": {
    "table": "BranchConnection",
    "delegate": "branchConnection",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "fromUserId",
        "kind": "scalar",
        "type": "Int",
        "column": "fromUserId"
      },
      {
        "name": "toUserId",
        "kind": "scalar",
        "type": "Int",
        "column": "toUserId",
        "isOptional": true
      },
      {
        "name": "remoteUserId",
        "kind": "scalar",
        "type": "Int",
        "column": "remoteUserId",
        "isOptional": true
      },
      {
        "name": "remoteCompany",
        "kind": "scalar",
        "type": "String",
        "column": "remoteCompany",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "default": {
          "kind": "value",
          "value": "accepted"
        }
      },
      {
        "name": "tunnelUrl",
        "kind": "scalar",
        "type": "String",
        "column": "tunnelUrl",
        "isOptional": true
      },
      {
        "name": "apiToken",
        "kind": "scalar",
        "type": "String",
        "column": "apiToken",
        "isOptional": true
      },
      {
        "name": "branchName",
        "kind": "scalar",
        "type": "String",
        "column": "branchName",
        "isOptional": true
      },
      {
        "name": "lastCheckedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "lastCheckedAt",
        "isOptional": true
      },
      {
        "name": "isOnline",
        "kind": "scalar",
        "type": "Boolean",
        "column": "isOnline",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "requestedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "requestedAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "respondedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "respondedAt",
        "isOptional": true
      },
      {
        "name": "fromUser",
        "kind": "relation",
        "type": "User",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "fromUserId"
        ],
        "toFields": [
          "id"
        ]
      },
      {
        "name": "toUser",
        "kind": "relation",
        "type": "User",
        "isList": false,
        "isOptional": true,
        "side": "owner",
        "fromFields": [
          "toUserId"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "StockTransfer": {
    "table": "StockTransfer",
    "delegate": "stockTransfer",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "transferNo",
        "kind": "scalar",
        "type": "String",
        "column": "transferNo",
        "isOptional": true
      },
      {
        "name": "fromUserId",
        "kind": "scalar",
        "type": "Int",
        "column": "fromUserId"
      },
      {
        "name": "toUserId",
        "kind": "scalar",
        "type": "Int",
        "column": "toUserId"
      },
      {
        "name": "transferMode",
        "kind": "scalar",
        "type": "String",
        "column": "transferMode",
        "default": {
          "kind": "value",
          "value": "connected"
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "default": {
          "kind": "value",
          "value": "pending"
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "completedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "completedAt",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "remark",
        "kind": "scalar",
        "type": "String",
        "column": "remark",
        "isOptional": true
      },
      {
        "name": "fromBranchNameSnapshot",
        "kind": "scalar",
        "type": "String",
        "column": "fromBranchNameSnapshot",
        "isOptional": true
      },
      {
        "name": "fromBranchEmailSnapshot",
        "kind": "scalar",
        "type": "String",
        "column": "fromBranchEmailSnapshot",
        "isOptional": true
      },
      {
        "name": "toBranchNameSnapshot",
        "kind": "scalar",
        "type": "String",
        "column": "toBranchNameSnapshot",
        "isOptional": true
      },
      {
        "name": "toBranchEmailSnapshot",
        "kind": "scalar",
        "type": "String",
        "column": "toBranchEmailSnapshot",
        "isOptional": true
      },
      {
        "name": "toBranchDetailSnapshot",
        "kind": "scalar",
        "type": "String",
        "column": "toBranchDetailSnapshot",
        "isOptional": true
      },
      {
        "name": "items",
        "kind": "relation",
        "type": "StockTransferItem",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "transferId"
        ]
      }
    ]
  },
  "StockTransferItem": {
    "table": "StockTransferItem",
    "delegate": "stockTransferItem",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "transferId",
        "kind": "scalar",
        "type": "Int",
        "column": "transferId"
      },
      {
        "name": "itemcode",
        "kind": "scalar",
        "type": "String",
        "column": "itemcode",
        "isOptional": true
      },
      {
        "name": "itemName",
        "kind": "scalar",
        "type": "String",
        "column": "itemName",
        "isOptional": true
      },
      {
        "name": "lotId",
        "kind": "scalar",
        "type": "Int",
        "column": "lotId",
        "isOptional": true
      },
      {
        "name": "lot",
        "kind": "scalar",
        "type": "String",
        "column": "lot",
        "isOptional": true
      },
      {
        "name": "dateExp",
        "kind": "scalar",
        "type": "DateTime",
        "column": "dateExp",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Float",
        "column": "qty",
        "isOptional": true
      },
      {
        "name": "cost",
        "kind": "scalar",
        "type": "Float",
        "column": "cost",
        "isOptional": true
      },
      {
        "name": "confirmedQty",
        "kind": "scalar",
        "type": "Float",
        "column": "confirmedQty",
        "isOptional": true
      },
      {
        "name": "itemStatus",
        "kind": "scalar",
        "type": "String",
        "column": "itemStatus",
        "default": {
          "kind": "value",
          "value": "pending"
        }
      },
      {
        "name": "personsale",
        "kind": "scalar",
        "type": "String",
        "column": "personsale",
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "barcode",
        "kind": "scalar",
        "type": "String",
        "column": "barcode",
        "isOptional": true
      },
      {
        "name": "unit",
        "kind": "scalar",
        "type": "String",
        "column": "unit",
        "isOptional": true
      },
      {
        "name": "transfer",
        "kind": "relation",
        "type": "StockTransfer",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "transferId"
        ],
        "toFields": [
          "id"
        ]
      }
    ]
  },
  "UnitConversion": {
    "table": "UnitConversion",
    "delegate": "unitConversion",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "productCode",
        "kind": "scalar",
        "type": "String",
        "column": "productCode",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Int",
        "column": "qty",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 1
        }
      },
      {
        "name": "saleUnit",
        "kind": "scalar",
        "type": "String",
        "column": "saleUnit",
        "isOptional": true
      },
      {
        "name": "subQty",
        "kind": "scalar",
        "type": "Float",
        "column": "subQty",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 12
        }
      },
      {
        "name": "subUnit",
        "kind": "scalar",
        "type": "String",
        "column": "subUnit",
        "isOptional": true
      },
      {
        "name": "priceRetail",
        "kind": "scalar",
        "type": "Float",
        "column": "priceRetail",
        "isOptional": true
      },
      {
        "name": "priceWholesale",
        "kind": "scalar",
        "type": "Float",
        "column": "priceWholesale",
        "isOptional": true
      },
      {
        "name": "priceOnline",
        "kind": "scalar",
        "type": "Float",
        "column": "priceOnline",
        "isOptional": true
      },
      {
        "name": "priceA",
        "kind": "scalar",
        "type": "Float",
        "column": "priceA",
        "isOptional": true
      },
      {
        "name": "priceB",
        "kind": "scalar",
        "type": "Float",
        "column": "priceB",
        "isOptional": true
      },
      {
        "name": "priceC",
        "kind": "scalar",
        "type": "Float",
        "column": "priceC",
        "isOptional": true
      },
      {
        "name": "priceD",
        "kind": "scalar",
        "type": "Float",
        "column": "priceD",
        "isOptional": true
      },
      {
        "name": "priceE",
        "kind": "scalar",
        "type": "Float",
        "column": "priceE",
        "isOptional": true
      },
      {
        "name": "priceF",
        "kind": "scalar",
        "type": "Float",
        "column": "priceF",
        "isOptional": true
      },
      {
        "name": "priceG",
        "kind": "scalar",
        "type": "Float",
        "column": "priceG",
        "isOptional": true
      },
      {
        "name": "priceH",
        "kind": "scalar",
        "type": "Float",
        "column": "priceH",
        "isOptional": true
      },
      {
        "name": "Barcode",
        "kind": "scalar",
        "type": "String",
        "column": "Barcode",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "TemperatureRecord": {
    "table": "TemperatureRecord",
    "delegate": "temperatureRecord",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "recordDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "recordDate",
        "isOptional": true
      },
      {
        "name": "recordPoint",
        "kind": "scalar",
        "type": "Int",
        "column": "recordPoint",
        "isOptional": true
      },
      {
        "name": "recordTime",
        "kind": "scalar",
        "type": "Int",
        "column": "recordTime",
        "isOptional": true
      },
      {
        "name": "temperature",
        "kind": "scalar",
        "type": "Float",
        "column": "temperature",
        "isOptional": true
      },
      {
        "name": "humidity",
        "kind": "scalar",
        "type": "Float",
        "column": "humidity",
        "isOptional": true
      },
      {
        "name": "locationType",
        "kind": "scalar",
        "type": "String",
        "column": "locationType",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "TemperatureSetting": {
    "table": "TemperatureSetting",
    "delegate": "temperatureSetting",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "roomTempMin",
        "kind": "scalar",
        "type": "Float",
        "column": "roomTempMin",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "roomTempMax",
        "kind": "scalar",
        "type": "Float",
        "column": "roomTempMax",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 30
        }
      },
      {
        "name": "roomHumidMin",
        "kind": "scalar",
        "type": "Float",
        "column": "roomHumidMin",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 30
        }
      },
      {
        "name": "roomHumidMax",
        "kind": "scalar",
        "type": "Float",
        "column": "roomHumidMax",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 50
        }
      },
      {
        "name": "fridgeTempMin",
        "kind": "scalar",
        "type": "Float",
        "column": "fridgeTempMin",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 2
        }
      },
      {
        "name": "fridgeTempMax",
        "kind": "scalar",
        "type": "Float",
        "column": "fridgeTempMax",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 8
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "LeaveConfig": {
    "table": "LeaveConfig",
    "delegate": "leaveConfig",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "idcompany",
        "kind": "scalar",
        "type": "String",
        "column": "idcompany",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "vacationDays",
        "kind": "scalar",
        "type": "Int",
        "column": "vacationDays",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 6
        }
      },
      {
        "name": "personalDays",
        "kind": "scalar",
        "type": "Int",
        "column": "personalDays",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 3
        }
      },
      {
        "name": "sickDays",
        "kind": "scalar",
        "type": "Int",
        "column": "sickDays",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 30
        }
      },
      {
        "name": "lateLimit",
        "kind": "scalar",
        "type": "Int",
        "column": "lateLimit",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 3
        }
      },
      {
        "name": "workStartTime",
        "kind": "scalar",
        "type": "String",
        "column": "workStartTime",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "08:30"
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "LeaveRecord": {
    "table": "LeaveRecord",
    "delegate": "leaveRecord",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "idcompany",
        "kind": "scalar",
        "type": "String",
        "column": "idcompany",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "personId",
        "kind": "scalar",
        "type": "Int",
        "column": "personId",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "leaveType",
        "kind": "scalar",
        "type": "String",
        "column": "leaveType",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "leaveDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "leaveDate",
        "isOptional": true
      },
      {
        "name": "reason",
        "kind": "scalar",
        "type": "String",
        "column": "reason",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "pending"
        }
      },
      {
        "name": "rejectReason",
        "kind": "scalar",
        "type": "String",
        "column": "rejectReason",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "approvedBy",
        "kind": "scalar",
        "type": "String",
        "column": "approvedBy",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "approvedDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "approvedDate",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "TemperaturePoint": {
    "table": "TemperaturePoint",
    "delegate": "temperaturePoint",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "pointNumber",
        "kind": "scalar",
        "type": "Int",
        "column": "pointNumber",
        "isOptional": true
      },
      {
        "name": "pointName",
        "kind": "scalar",
        "type": "String",
        "column": "pointName",
        "isOptional": true
      },
      {
        "name": "detail",
        "kind": "scalar",
        "type": "String",
        "column": "detail",
        "isOptional": true
      },
      {
        "name": "locationType",
        "kind": "scalar",
        "type": "String",
        "column": "locationType",
        "isOptional": true
      },
      {
        "name": "isActive",
        "kind": "scalar",
        "type": "Boolean",
        "column": "isActive",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "SyncLog": {
    "table": "SyncLog",
    "delegate": "syncLog",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "targetBranch",
        "kind": "scalar",
        "type": "String",
        "column": "targetBranch",
        "isOptional": true
      },
      {
        "name": "branchName",
        "kind": "scalar",
        "type": "String",
        "column": "branchName",
        "isOptional": true
      },
      {
        "name": "syncType",
        "kind": "scalar",
        "type": "String",
        "column": "syncType",
        "isOptional": true
      },
      {
        "name": "recordCount",
        "kind": "scalar",
        "type": "Int",
        "column": "recordCount",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "created",
        "kind": "scalar",
        "type": "Int",
        "column": "created",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "updated",
        "kind": "scalar",
        "type": "Int",
        "column": "updated",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "pending"
        }
      },
      {
        "name": "error",
        "kind": "scalar",
        "type": "String",
        "column": "error",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "UserActionLog": {
    "table": "UserActionLog",
    "delegate": "userActionLog",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "personId",
        "kind": "scalar",
        "type": "Int",
        "column": "personId",
        "isOptional": true
      },
      {
        "name": "personName",
        "kind": "scalar",
        "type": "String",
        "column": "personName",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "ไม่ทราบผู้ใช้"
        }
      },
      {
        "name": "actionType",
        "kind": "scalar",
        "type": "String",
        "column": "actionType"
      },
      {
        "name": "entityType",
        "kind": "scalar",
        "type": "String",
        "column": "entityType"
      },
      {
        "name": "entityId",
        "kind": "scalar",
        "type": "String",
        "column": "entityId",
        "isOptional": true
      },
      {
        "name": "entityCode",
        "kind": "scalar",
        "type": "String",
        "column": "entityCode",
        "isOptional": true
      },
      {
        "name": "route",
        "kind": "scalar",
        "type": "String",
        "column": "route",
        "isOptional": true
      },
      {
        "name": "buttonLabel",
        "kind": "scalar",
        "type": "String",
        "column": "buttonLabel",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "default": {
          "kind": "value",
          "value": "success"
        }
      },
      {
        "name": "message",
        "kind": "scalar",
        "type": "String",
        "column": "message",
        "isOptional": true
      },
      {
        "name": "errorMessage",
        "kind": "scalar",
        "type": "String",
        "column": "errorMessage",
        "isOptional": true
      },
      {
        "name": "metadata",
        "kind": "scalar",
        "type": "Json",
        "column": "metadata",
        "isOptional": true
      },
      {
        "name": "durationMs",
        "kind": "scalar",
        "type": "Int",
        "column": "durationMs",
        "isOptional": true
      },
      {
        "name": "sessionId",
        "kind": "scalar",
        "type": "String",
        "column": "sessionId",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "SyncSchedule": {
    "table": "SyncSchedule",
    "delegate": "syncSchedule",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "intervalMinutes",
        "kind": "scalar",
        "type": "Int",
        "column": "intervalMinutes",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 60
        }
      },
      {
        "name": "syncTypes",
        "kind": "scalar",
        "type": "String",
        "column": "syncTypes",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "datalist,labeldata,supplier"
        }
      },
      {
        "name": "targetBranches",
        "kind": "scalar",
        "type": "String",
        "column": "targetBranches",
        "isOptional": true
      },
      {
        "name": "enabled",
        "kind": "scalar",
        "type": "Boolean",
        "column": "enabled",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "lastRunAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "lastRunAt",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "UsageLabelGroup": {
    "table": "UsageLabelGroup",
    "delegate": "usageLabelGroup",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "groupName",
        "kind": "scalar",
        "type": "String",
        "column": "groupName",
        "isOptional": true
      },
      {
        "name": "shortName",
        "kind": "scalar",
        "type": "String",
        "column": "shortName",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "useS",
        "kind": "scalar",
        "type": "String",
        "column": "useS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "timeS",
        "kind": "scalar",
        "type": "String",
        "column": "timeS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "timeuseS",
        "kind": "scalar",
        "type": "String",
        "column": "timeuseS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "keepS",
        "kind": "scalar",
        "type": "String",
        "column": "keepS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "remarkS",
        "kind": "scalar",
        "type": "String",
        "column": "remarkS",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      }
    ]
  },
  "OtRequest": {
    "table": "OtRequest",
    "delegate": "otRequest",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "idcompany",
        "kind": "scalar",
        "type": "String",
        "column": "idcompany",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "personId",
        "kind": "scalar",
        "type": "Int",
        "column": "personId",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "otDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "otDate",
        "isOptional": true
      },
      {
        "name": "startTime",
        "kind": "scalar",
        "type": "String",
        "column": "startTime",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "endTime",
        "kind": "scalar",
        "type": "String",
        "column": "endTime",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "hours",
        "kind": "scalar",
        "type": "Float",
        "column": "hours",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "reason",
        "kind": "scalar",
        "type": "String",
        "column": "reason",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "pending"
        }
      },
      {
        "name": "rejectReason",
        "kind": "scalar",
        "type": "String",
        "column": "rejectReason",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "approvedBy",
        "kind": "scalar",
        "type": "String",
        "column": "approvedBy",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "approvedDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "approvedDate",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "ChatChannel": {
    "table": "ChatChannel",
    "delegate": "chatChannel",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "platform",
        "kind": "scalar",
        "type": "String",
        "column": "platform"
      },
      {
        "name": "channelName",
        "kind": "scalar",
        "type": "String",
        "column": "channelName",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "accessToken",
        "kind": "scalar",
        "type": "String",
        "column": "accessToken",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "channelSecret",
        "kind": "scalar",
        "type": "String",
        "column": "channelSecret",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "pageId",
        "kind": "scalar",
        "type": "String",
        "column": "pageId",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "webhookUrl",
        "kind": "scalar",
        "type": "String",
        "column": "webhookUrl",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "isActive",
        "kind": "scalar",
        "type": "Boolean",
        "column": "isActive",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      },
      {
        "name": "contacts",
        "kind": "relation",
        "type": "ChatContact",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "channelId"
        ]
      }
    ]
  },
  "ChatContact": {
    "table": "ChatContact",
    "delegate": "chatContact",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "channelId",
        "kind": "scalar",
        "type": "Int",
        "column": "channelId"
      },
      {
        "name": "channel",
        "kind": "relation",
        "type": "ChatChannel",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "channelId"
        ],
        "toFields": [
          "id"
        ]
      },
      {
        "name": "platformUserId",
        "kind": "scalar",
        "type": "String",
        "column": "platformUserId"
      },
      {
        "name": "displayName",
        "kind": "scalar",
        "type": "String",
        "column": "displayName",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "avatarUrl",
        "kind": "scalar",
        "type": "String",
        "column": "avatarUrl",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "phone",
        "kind": "scalar",
        "type": "String",
        "column": "phone",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "email",
        "kind": "scalar",
        "type": "String",
        "column": "email",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "tags",
        "kind": "scalar",
        "type": "String",
        "column": "tags",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "consentGiven",
        "kind": "scalar",
        "type": "Boolean",
        "column": "consentGiven",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "consentDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "consentDate",
        "isOptional": true
      },
      {
        "name": "lastMessageAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "lastMessageAt",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      },
      {
        "name": "conversations",
        "kind": "relation",
        "type": "ChatConversation",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "contactId"
        ]
      }
    ]
  },
  "ChatConversation": {
    "table": "ChatConversation",
    "delegate": "chatConversation",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "contactId",
        "kind": "scalar",
        "type": "Int",
        "column": "contactId"
      },
      {
        "name": "contact",
        "kind": "relation",
        "type": "ChatContact",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "contactId"
        ],
        "toFields": [
          "id"
        ]
      },
      {
        "name": "assignedTo",
        "kind": "scalar",
        "type": "String",
        "column": "assignedTo",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "default": {
          "kind": "value",
          "value": "open"
        }
      },
      {
        "name": "subject",
        "kind": "scalar",
        "type": "String",
        "column": "subject",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "priority",
        "kind": "scalar",
        "type": "String",
        "column": "priority",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "normal"
        }
      },
      {
        "name": "lastMessageAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "lastMessageAt",
        "isOptional": true
      },
      {
        "name": "closedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "closedAt",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      },
      {
        "name": "messages",
        "kind": "relation",
        "type": "ChatMessage",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "conversationId"
        ]
      },
      {
        "name": "videoCalls",
        "kind": "relation",
        "type": "VideoCall",
        "isList": true,
        "isOptional": false,
        "side": "back",
        "fromFields": [
          "id"
        ],
        "toFields": [
          "conversationId"
        ]
      }
    ]
  },
  "ChatMessage": {
    "table": "ChatMessage",
    "delegate": "chatMessage",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "conversationId",
        "kind": "scalar",
        "type": "Int",
        "column": "conversationId"
      },
      {
        "name": "conversation",
        "kind": "relation",
        "type": "ChatConversation",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "conversationId"
        ],
        "toFields": [
          "id"
        ]
      },
      {
        "name": "senderType",
        "kind": "scalar",
        "type": "String",
        "column": "senderType"
      },
      {
        "name": "senderName",
        "kind": "scalar",
        "type": "String",
        "column": "senderName",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "messageType",
        "kind": "scalar",
        "type": "String",
        "column": "messageType",
        "default": {
          "kind": "value",
          "value": "text"
        }
      },
      {
        "name": "content",
        "kind": "scalar",
        "type": "String",
        "column": "content",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "mediaUrl",
        "kind": "scalar",
        "type": "String",
        "column": "mediaUrl",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "metadata",
        "kind": "scalar",
        "type": "String",
        "column": "metadata",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": "{}"
        }
      },
      {
        "name": "isRead",
        "kind": "scalar",
        "type": "Boolean",
        "column": "isRead",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "readAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "readAt",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "VideoCall": {
    "table": "VideoCall",
    "delegate": "videoCall",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "conversationId",
        "kind": "scalar",
        "type": "Int",
        "column": "conversationId"
      },
      {
        "name": "conversation",
        "kind": "relation",
        "type": "ChatConversation",
        "isList": false,
        "isOptional": false,
        "side": "owner",
        "fromFields": [
          "conversationId"
        ],
        "toFields": [
          "id"
        ]
      },
      {
        "name": "roomId",
        "kind": "scalar",
        "type": "String",
        "column": "roomId",
        "isUnique": true
      },
      {
        "name": "initiatedBy",
        "kind": "scalar",
        "type": "String",
        "column": "initiatedBy",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "default": {
          "kind": "value",
          "value": "pending"
        }
      },
      {
        "name": "startedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "startedAt",
        "isOptional": true
      },
      {
        "name": "endedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "endedAt",
        "isOptional": true
      },
      {
        "name": "duration",
        "kind": "scalar",
        "type": "Int",
        "column": "duration",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "recordingUrl",
        "kind": "scalar",
        "type": "String",
        "column": "recordingUrl",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "notes",
        "kind": "scalar",
        "type": "String",
        "column": "notes",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "consentGiven",
        "kind": "scalar",
        "type": "Boolean",
        "column": "consentGiven",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "ChatQuickReply": {
    "table": "ChatQuickReply",
    "delegate": "chatQuickReply",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "title",
        "kind": "scalar",
        "type": "String",
        "column": "title",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "content",
        "kind": "scalar",
        "type": "String",
        "column": "content",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "category",
        "kind": "scalar",
        "type": "String",
        "column": "category",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "shortcut",
        "kind": "scalar",
        "type": "String",
        "column": "shortcut",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "TelegramBinding": {
    "table": "TelegramBinding",
    "delegate": "telegramBinding",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company"
      },
      {
        "name": "branchId",
        "kind": "scalar",
        "type": "Int",
        "column": "branchId",
        "isOptional": true
      },
      {
        "name": "chatId",
        "kind": "scalar",
        "type": "String",
        "column": "chatId",
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "chatTitle",
        "kind": "scalar",
        "type": "String",
        "column": "chatTitle",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "chatType",
        "kind": "scalar",
        "type": "String",
        "column": "chatType",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "notifySale",
        "kind": "scalar",
        "type": "Boolean",
        "column": "notifySale",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "notifyCancel",
        "kind": "scalar",
        "type": "Boolean",
        "column": "notifyCancel",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "notifyHourly",
        "kind": "scalar",
        "type": "Boolean",
        "column": "notifyHourly",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "notifyDaily",
        "kind": "scalar",
        "type": "Boolean",
        "column": "notifyDaily",
        "default": {
          "kind": "value",
          "value": true
        }
      },
      {
        "name": "minAmount",
        "kind": "scalar",
        "type": "Float",
        "column": "minAmount",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "quietStart",
        "kind": "scalar",
        "type": "String",
        "column": "quietStart",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "quietEnd",
        "kind": "scalar",
        "type": "String",
        "column": "quietEnd",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "bindToken",
        "kind": "scalar",
        "type": "String",
        "column": "bindToken",
        "isUnique": true
      },
      {
        "name": "bindExpiresAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "bindExpiresAt",
        "isOptional": true
      },
      {
        "name": "isActive",
        "kind": "scalar",
        "type": "Boolean",
        "column": "isActive",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "TelegramNotifyLog": {
    "table": "TelegramNotifyLog",
    "delegate": "telegramNotifyLog",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "bindingId",
        "kind": "scalar",
        "type": "Int",
        "column": "bindingId"
      },
      {
        "name": "eventType",
        "kind": "scalar",
        "type": "String",
        "column": "eventType"
      },
      {
        "name": "refType",
        "kind": "scalar",
        "type": "String",
        "column": "refType",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "refId",
        "kind": "scalar",
        "type": "Int",
        "column": "refId",
        "isOptional": true
      },
      {
        "name": "payload",
        "kind": "scalar",
        "type": "String",
        "column": "payload",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "success",
        "kind": "scalar",
        "type": "Boolean",
        "column": "success",
        "default": {
          "kind": "value",
          "value": false
        }
      },
      {
        "name": "error",
        "kind": "scalar",
        "type": "String",
        "column": "error",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "sentAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "sentAt",
        "default": {
          "kind": "now"
        }
      }
    ]
  },
  "DailyClose": {
    "table": "DailyClose",
    "delegate": "dailyClose",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company"
      },
      {
        "name": "closeDate",
        "kind": "scalar",
        "type": "DateTime",
        "column": "closeDate"
      },
      {
        "name": "workTimeStart",
        "kind": "scalar",
        "type": "String",
        "column": "workTimeStart",
        "isOptional": true
      },
      {
        "name": "workTimeEnd",
        "kind": "scalar",
        "type": "String",
        "column": "workTimeEnd",
        "isOptional": true
      },
      {
        "name": "salesTotal",
        "kind": "scalar",
        "type": "Float",
        "column": "salesTotal",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "promptpayTotal",
        "kind": "scalar",
        "type": "Float",
        "column": "promptpayTotal",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "transferTotal",
        "kind": "scalar",
        "type": "Float",
        "column": "transferTotal",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "cashTotal",
        "kind": "scalar",
        "type": "Float",
        "column": "cashTotal",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "otherTotal",
        "kind": "scalar",
        "type": "Float",
        "column": "otherTotal",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "cashDeliver",
        "kind": "scalar",
        "type": "Float",
        "column": "cashDeliver",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "note",
        "kind": "scalar",
        "type": "String",
        "column": "note",
        "isOptional": true
      },
      {
        "name": "b1000",
        "kind": "scalar",
        "type": "Int",
        "column": "b1000",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "b500",
        "kind": "scalar",
        "type": "Int",
        "column": "b500",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "b100",
        "kind": "scalar",
        "type": "Int",
        "column": "b100",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "b50",
        "kind": "scalar",
        "type": "Int",
        "column": "b50",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "b20",
        "kind": "scalar",
        "type": "Int",
        "column": "b20",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "b10",
        "kind": "scalar",
        "type": "Int",
        "column": "b10",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "b5",
        "kind": "scalar",
        "type": "Int",
        "column": "b5",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "b2",
        "kind": "scalar",
        "type": "Int",
        "column": "b2",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "b1",
        "kind": "scalar",
        "type": "Int",
        "column": "b1",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "totalCounted",
        "kind": "scalar",
        "type": "Float",
        "column": "totalCounted",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "diff",
        "kind": "scalar",
        "type": "Float",
        "column": "diff",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "changeAmount",
        "kind": "scalar",
        "type": "Float",
        "column": "changeAmount",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "drawerBalance",
        "kind": "scalar",
        "type": "Float",
        "column": "drawerBalance",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "employeeName",
        "kind": "scalar",
        "type": "String",
        "column": "employeeName",
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "branchName",
        "kind": "scalar",
        "type": "String",
        "column": "branchName",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "default": {
          "kind": "value",
          "value": "draft"
        }
      },
      {
        "name": "createdBy",
        "kind": "scalar",
        "type": "String",
        "column": "createdBy",
        "isOptional": true
      },
      {
        "name": "updatedBy",
        "kind": "scalar",
        "type": "String",
        "column": "updatedBy",
        "isOptional": true
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      }
    ]
  },
  "SelfhealRcitemlistSaleLog": {
    "table": "SelfhealRcitemlistSaleLog",
    "delegate": "selfhealRcitemlistSaleLog",
    "idField": "log_id",
    "fields": [
      {
        "name": "log_id",
        "kind": "scalar",
        "type": "Int",
        "column": "log_id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "fixed_at",
        "kind": "scalar",
        "type": "DateTime",
        "column": "fixed_at",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "rc_id",
        "kind": "scalar",
        "type": "Int",
        "column": "rc_id"
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "itemcode",
        "kind": "scalar",
        "type": "String",
        "column": "itemcode",
        "isOptional": true
      },
      {
        "name": "lot",
        "kind": "scalar",
        "type": "String",
        "column": "lot",
        "isOptional": true
      },
      {
        "name": "qty",
        "kind": "scalar",
        "type": "Float",
        "column": "qty",
        "isOptional": true
      },
      {
        "name": "freebaht",
        "kind": "scalar",
        "type": "Float",
        "column": "freebaht",
        "isOptional": true
      },
      {
        "name": "old_sale",
        "kind": "scalar",
        "type": "Float",
        "column": "old_sale",
        "isOptional": true
      },
      {
        "name": "new_sale",
        "kind": "scalar",
        "type": "Float",
        "column": "new_sale",
        "isOptional": true
      },
      {
        "name": "balance",
        "kind": "scalar",
        "type": "Float",
        "column": "balance",
        "isOptional": true
      }
    ]
  },
  "SelfhealRcitemlistDatercLog": {
    "table": "SelfhealRcitemlistDatercLog",
    "delegate": "selfhealRcitemlistDatercLog",
    "idField": "log_id",
    "fields": [
      {
        "name": "log_id",
        "kind": "scalar",
        "type": "Int",
        "column": "log_id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "fixed_at",
        "kind": "scalar",
        "type": "DateTime",
        "column": "fixed_at",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "rc_id",
        "kind": "scalar",
        "type": "Int",
        "column": "rc_id"
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "codenames",
        "kind": "scalar",
        "type": "String",
        "column": "codenames",
        "isOptional": true
      },
      {
        "name": "itemcode",
        "kind": "scalar",
        "type": "String",
        "column": "itemcode",
        "isOptional": true
      },
      {
        "name": "lot",
        "kind": "scalar",
        "type": "String",
        "column": "lot",
        "isOptional": true
      },
      {
        "name": "old_daterc",
        "kind": "scalar",
        "type": "DateTime",
        "column": "old_daterc",
        "isOptional": true
      },
      {
        "name": "new_daterc",
        "kind": "scalar",
        "type": "DateTime",
        "column": "new_daterc",
        "isOptional": true
      }
    ]
  },
  "SelfhealLotRelinkLog": {
    "table": "SelfhealLotRelinkLog",
    "delegate": "selfhealLotRelinkLog",
    "idField": "log_id",
    "fields": [
      {
        "name": "log_id",
        "kind": "scalar",
        "type": "Int",
        "column": "log_id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "fixed_at",
        "kind": "scalar",
        "type": "DateTime",
        "column": "fixed_at",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company",
        "isOptional": true
      },
      {
        "name": "itemcode",
        "kind": "scalar",
        "type": "String",
        "column": "itemcode",
        "isOptional": true
      },
      {
        "name": "person",
        "kind": "scalar",
        "type": "String",
        "column": "person",
        "isOptional": true
      },
      {
        "name": "kind",
        "kind": "scalar",
        "type": "String",
        "column": "kind"
      },
      {
        "name": "ref_id",
        "kind": "scalar",
        "type": "Int",
        "column": "ref_id"
      },
      {
        "name": "before",
        "kind": "scalar",
        "type": "Json",
        "column": "before",
        "isOptional": true
      },
      {
        "name": "after",
        "kind": "scalar",
        "type": "Json",
        "column": "after",
        "isOptional": true
      }
    ]
  },
  "SaleQueue": {
    "table": "SaleQueue",
    "delegate": "saleQueue",
    "idField": "id",
    "fields": [
      {
        "name": "id",
        "kind": "scalar",
        "type": "Int",
        "column": "id",
        "isId": true,
        "default": {
          "kind": "autoincrement"
        }
      },
      {
        "name": "company",
        "kind": "scalar",
        "type": "String",
        "column": "company"
      },
      {
        "name": "branch",
        "kind": "scalar",
        "type": "String",
        "column": "branch",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "queueNo",
        "kind": "scalar",
        "type": "Int",
        "column": "queueNo"
      },
      {
        "name": "queueDate",
        "kind": "scalar",
        "type": "String",
        "column": "queueDate"
      },
      {
        "name": "orderNo",
        "kind": "scalar",
        "type": "String",
        "column": "orderNo",
        "isOptional": true
      },
      {
        "name": "id_salemain",
        "kind": "scalar",
        "type": "Int",
        "column": "id_salemain",
        "isOptional": true
      },
      {
        "name": "customer",
        "kind": "scalar",
        "type": "String",
        "column": "customer",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "seller",
        "kind": "scalar",
        "type": "String",
        "column": "seller",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "itemCount",
        "kind": "scalar",
        "type": "Int",
        "column": "itemCount",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "totalAmount",
        "kind": "scalar",
        "type": "Float",
        "column": "totalAmount",
        "default": {
          "kind": "value",
          "value": 0
        }
      },
      {
        "name": "items",
        "kind": "scalar",
        "type": "Json",
        "column": "items",
        "isOptional": true
      },
      {
        "name": "status",
        "kind": "scalar",
        "type": "String",
        "column": "status",
        "default": {
          "kind": "value",
          "value": "waiting"
        }
      },
      {
        "name": "note",
        "kind": "scalar",
        "type": "String",
        "column": "note",
        "isOptional": true,
        "default": {
          "kind": "value",
          "value": ""
        }
      },
      {
        "name": "createdAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "createdAt",
        "default": {
          "kind": "now"
        }
      },
      {
        "name": "updatedAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "updatedAt",
        "updatedAt": true
      },
      {
        "name": "readyAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "readyAt",
        "isOptional": true
      },
      {
        "name": "doneAt",
        "kind": "scalar",
        "type": "DateTime",
        "column": "doneAt",
        "isOptional": true
      }
    ]
  }
} as any

/** delegate name (prisma.xxx) -> ชื่อ model */
export const DELEGATE_TO_MODEL: Record<string, string> = Object.fromEntries(
  Object.entries(MODELS).map(([name, m]) => [m.delegate, name])
)

/** DDL ทั้งหมด รันตามลำดับตอนเปิดฐานข้อมูลครั้งแรก */
export const SCHEMA_STATEMENTS: string[] = [
  "CREATE TABLE IF NOT EXISTS \"User\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"name\" TEXT,\n  \"company\" TEXT,\n  \"tel\" TEXT,\n  \"lineid\" TEXT,\n  \"email\" TEXT UNIQUE,\n  \"password\" TEXT,\n  \"package\" TEXT DEFAULT 'Free',\n  \"status\" TEXT DEFAULT 'Active',\n  \"numdate\" INTEGER DEFAULT 30,\n  \"enddate\" TEXT,\n  \"createdAt\" TEXT NOT NULL,\n  \"tunnelUrl\" TEXT,\n  \"apiToken\" TEXT,\n  \"pairingCode\" TEXT,\n  \"pairingCodeExpiresAt\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_User_company\" ON \"User\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SettingEmployee\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"name\" TEXT,\n  \"position\" TEXT,\n  \"level\" TEXT,\n  \"username\" TEXT UNIQUE,\n  \"password\" TEXT,\n  \"passwords\" TEXT,\n  \"mobile\" INTEGER NOT NULL DEFAULT 0,\n  \"timeIn\" TEXT,\n  \"timeOut\" TEXT,\n  \"salary\" REAL DEFAULT 0,\n  \"otRate\" REAL DEFAULT 0,\n  \"id_company\" INTEGER NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SettingEmployee_company\" ON \"SettingEmployee\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_SettingEmployee_id_company\" ON \"SettingEmployee\" (\"id_company\");",
  "CREATE TABLE IF NOT EXISTS \"CheckinFace\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"employeeId\" INTEGER NOT NULL UNIQUE,\n  \"faceDescriptor\" TEXT NOT NULL DEFAULT '',\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_CheckinFace_employeeId\" ON \"CheckinFace\" (\"employeeId\");",
  "CREATE TABLE IF NOT EXISTS \"Getagory\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"list\" TEXT,\n  \"company\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Getagory_company\" ON \"Getagory\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Group\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"list\" TEXT,\n  \"company\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Group_company\" ON \"Group\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Fixname\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"shortlist\" TEXT,\n  \"list\" TEXT,\n  \"company\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Fixname_company\" ON \"Fixname\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Type\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"shortlist\" TEXT,\n  \"list\" TEXT,\n  \"company\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Type_company\" ON \"Type\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Unit\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"list\" TEXT,\n  \"company\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Unit_company\" ON \"Unit\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Area\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"list\" TEXT,\n  \"company\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Area_company\" ON \"Area\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Datalist\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"code\" TEXT,\n  \"ProductName\" TEXT,\n  \"fixname\" TEXT,\n  \"group\" TEXT,\n  \"type\" TEXT,\n  \"subtype\" TEXT,\n  \"Category\" TEXT,\n  \"DrugRegistor\" TEXT,\n  \"Area\" TEXT,\n  \"Unit\" TEXT,\n  \"Barcode\" TEXT,\n  \"AlarmExp\" TEXT,\n  \"Remark\" TEXT,\n  \"Show\" TEXT,\n  \"Child\" TEXT,\n  \"CI\" TEXT,\n  \"CostActual\" REAL,\n  \"price\" REAL,\n  \"wholesaleprice\" REAL,\n  \"online\" REAL,\n  \"PriceA\" REAL,\n  \"PriceB\" REAL,\n  \"PriceC\" REAL,\n  \"PriceD\" REAL,\n  \"PriceE\" REAL,\n  \"PriceF\" REAL,\n  \"PriceG\" REAL,\n  \"PriceH\" REAL,\n  \"Max\" REAL,\n  \"Min\" REAL,\n  \"ROP\" REAL,\n  \"pic\" TEXT,\n  \"maker\" TEXT DEFAULT '',\n  \"qty_unit\" TEXT DEFAULT '',\n  \"concentration\" REAL,\n  \"dosePerKg\" REAL,\n  \"doseFrequency\" INTEGER,\n  \"maxDosePerDay\" REAL,\n  \"memberDiscountEligible\" INTEGER NOT NULL DEFAULT 1,\n  \"requireLot\" INTEGER NOT NULL DEFAULT 1\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Datalist_company\" ON \"Datalist\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Datalist_code\" ON \"Datalist\" (\"code\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Datalist_Barcode\" ON \"Datalist\" (\"Barcode\");",
  "CREATE TABLE IF NOT EXISTS \"ProductBarcode\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"productCode\" TEXT NOT NULL,\n  \"productId\" INTEGER,\n  \"barcode\" TEXT NOT NULL,\n  \"note\" TEXT DEFAULT '',\n  \"isActive\" INTEGER NOT NULL DEFAULT 1,\n  \"createdBy\" TEXT DEFAULT '',\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ProductBarcode_company\" ON \"ProductBarcode\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"DrugSet\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"name\" TEXT NOT NULL,\n  \"description\" TEXT DEFAULT '',\n  \"status\" TEXT DEFAULT 'active',\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_DrugSet_company\" ON \"DrugSet\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"DrugSetItem\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"drugSetId\" INTEGER NOT NULL,\n  \"productId\" INTEGER,\n  \"code\" TEXT DEFAULT '',\n  \"name\" TEXT DEFAULT '',\n  \"fixname\" TEXT DEFAULT '',\n  \"drugGroup\" TEXT DEFAULT '',\n  \"barcode\" TEXT DEFAULT '',\n  \"unit\" TEXT DEFAULT '',\n  \"qty\" REAL NOT NULL DEFAULT 1,\n  \"salePrice\" REAL DEFAULT 0,\n  \"cost\" REAL DEFAULT 0,\n  \"sortOrder\" INTEGER NOT NULL DEFAULT 0,\n  \"createdAt\" TEXT NOT NULL,\n  \"unitConversionId\" INTEGER,\n  \"saleUnit\" TEXT DEFAULT '',\n  \"subQty\" REAL DEFAULT 1,\n  \"priceOverride\" REAL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_DrugSetItem_code\" ON \"DrugSetItem\" (\"code\");",
  "CREATE INDEX IF NOT EXISTS \"idx_DrugSetItem_drugSetId\" ON \"DrugSetItem\" (\"drugSetId\");",
  "CREATE INDEX IF NOT EXISTS \"idx_DrugSetItem_productId\" ON \"DrugSetItem\" (\"productId\");",
  "CREATE TABLE IF NOT EXISTS \"Customer\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"code\" TEXT,\n  \"sex\" TEXT,\n  \"idcode\" TEXT,\n  \"age\" INTEGER,\n  \"address\" TEXT,\n  \"branch\" TEXT,\n  \"levelPrice\" TEXT,\n  \"tel\" TEXT,\n  \"pointStart\" INTEGER,\n  \"point\" INTEGER,\n  \"totalPoint\" INTEGER,\n  \"customer\" TEXT,\n  \"congenitalDisease\" TEXT,\n  \"names\" TEXT,\n  \"statuss\" TEXT,\n  \"birthday\" TEXT,\n  \"numbertax\" TEXT DEFAULT '',\n  \"moreInfo\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Customer_company\" ON \"Customer\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Customer_code\" ON \"Customer\" (\"code\");",
  "CREATE TABLE IF NOT EXISTS \"Drugallergy\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"drugallergy\" TEXT,\n  \"remark\" TEXT,\n  \"id_cus\" INTEGER NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Drugallergy_company\" ON \"Drugallergy\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Drugallergy_id_cus\" ON \"Drugallergy\" (\"id_cus\");",
  "CREATE TABLE IF NOT EXISTS \"Supplier\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"code\" TEXT,\n  \"names\" TEXT,\n  \"tel\" TEXT,\n  \"idcode\" TEXT,\n  \"address\" TEXT,\n  \"statuss\" TEXT,\n  \"leadtime\" INTEGER,\n  \"email\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Supplier_company\" ON \"Supplier\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Supplier_code\" ON \"Supplier\" (\"code\");",
  "CREATE TABLE IF NOT EXISTS \"Receive\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"code\" TEXT,\n  \"orderNo\" TEXT DEFAULT '',\n  \"orderfull\" TEXT DEFAULT '',\n  \"names\" TEXT,\n  \"invoice_No\" TEXT,\n  \"statuss\" TEXT,\n  \"order_date\" TEXT,\n  \"receive_date\" TEXT,\n  \"tax_date\" TEXT,\n  \"tax_no\" TEXT DEFAULT '',\n  \"pay_date\" TEXT,\n  \"codenames\" TEXT,\n  \"persons\" TEXT DEFAULT '',\n  \"totalRC\" REAL DEFAULT 0,\n  \"vatRC\" REAL DEFAULT 0,\n  \"discountRC\" REAL DEFAULT 0,\n  \"totalRCAll\" REAL DEFAULT 0,\n  \"countorder\" REAL DEFAULT 0,\n  \"purchase_debit_date\" TEXT,\n  \"purchase_debit_number\" INTEGER,\n  \"purchase_debit_orderNo\" TEXT,\n  \"purchase_debit_orderfull\" TEXT,\n  \"purchase_debit_status\" TEXT,\n  \"purchase_debit_person\" TEXT,\n  \"purchase_debit_remark\" TEXT,\n  \"purchase_debit_reference_no\" TEXT,\n  \"purchase_debit_reference_book_no\" TEXT,\n  \"purchase_debit_reason\" TEXT,\n  \"purchase_debit_original_amount\" REAL,\n  \"purchase_debit_correct_amount\" REAL,\n  \"purchase_debit_difference_amount\" REAL,\n  \"purchase_debit_vat_rate\" INTEGER,\n  \"purchase_debit_vat_amount\" REAL,\n  \"purchase_debit_grand_total\" REAL,\n  \"purchase_credit_date\" TEXT,\n  \"purchase_credit_number\" INTEGER,\n  \"purchase_credit_orderNo\" TEXT,\n  \"purchase_credit_orderfull\" TEXT,\n  \"purchase_credit_status\" TEXT,\n  \"purchase_credit_person\" TEXT,\n  \"purchase_credit_remark\" TEXT,\n  \"purchase_credit_reference_no\" TEXT,\n  \"purchase_credit_reference_book_no\" TEXT,\n  \"purchase_credit_reason\" TEXT,\n  \"purchase_credit_item_name\" TEXT,\n  \"purchase_credit_item_qty\" REAL,\n  \"purchase_credit_items_json\" TEXT,\n  \"purchase_credit_original_amount\" REAL,\n  \"purchase_credit_correct_amount\" REAL,\n  \"purchase_credit_difference_amount\" REAL,\n  \"purchase_credit_reduce_amount\" REAL,\n  \"purchase_credit_vat_rate\" INTEGER,\n  \"purchase_credit_vat_amount\" REAL,\n  \"purchase_credit_net_total\" REAL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Receive_company\" ON \"Receive\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Receive_code\" ON \"Receive\" (\"code\");",
  "CREATE TABLE IF NOT EXISTS \"ConfirmRC\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"receiveId\" INTEGER NOT NULL UNIQUE,\n  \"status\" TEXT DEFAULT 'confirmed',\n  \"confirmedAt\" TEXT,\n  \"confirmedBy\" TEXT DEFAULT '',\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ConfirmRC_company\" ON \"ConfirmRC\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_ConfirmRC_receiveId\" ON \"ConfirmRC\" (\"receiveId\");",
  "CREATE TABLE IF NOT EXISTS \"RCitemlist\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"codenames\" TEXT,\n  \"itemcode\" TEXT,\n  \"itemName\" TEXT,\n  \"unit\" TEXT,\n  \"createDate\" TEXT,\n  \"newCost\" REAL,\n  \"netCost\" REAL,\n  \"qty\" REAL,\n  \"totalcost\" REAL,\n  \"lot\" TEXT,\n  \"dateExp\" TEXT,\n  \"freebaht\" REAL,\n  \"discountbaht\" REAL,\n  \"sale\" REAL,\n  \"Barcode\" TEXT,\n  \"type\" TEXT DEFAULT '',\n  \"subtype\" TEXT DEFAULT '',\n  \"person\" TEXT,\n  \"statuss\" TEXT,\n  \"dateRC\" TEXT,\n  \"balance\" REAL,\n  \"codevender\" TEXT DEFAULT '',\n  \"namevender\" TEXT DEFAULT '',\n  \"maker\" TEXT DEFAULT '',\n  \"qty_unit\" TEXT DEFAULT '',\n  \"saleQty\" REAL,\n  \"saleUnit\" TEXT,\n  \"saleFactor\" REAL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_RCitemlist_company\" ON \"RCitemlist\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_RCitemlist_Barcode\" ON \"RCitemlist\" (\"Barcode\");",
  "CREATE INDEX IF NOT EXISTS \"idx_RCitemlist_createDate\" ON \"RCitemlist\" (\"createDate\");",
  "CREATE TABLE IF NOT EXISTS \"SaleMain\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"createDate\" TEXT,\n  \"id_costomer\" INTEGER,\n  \"code_costomer\" TEXT,\n  \"group_price\" TEXT,\n  \"pay\" TEXT,\n  \"bill\" INTEGER,\n  \"discount\" REAL,\n  \"memberDiscount\" REAL DEFAULT 0,\n  \"memberDiscountPercent\" REAL DEFAULT 0,\n  \"sumtotal\" REAL,\n  \"addreward\" REAL,\n  \"usereward\" REAL,\n  \"companyall\" TEXT,\n  \"personall\" TEXT,\n  \"statussall\" TEXT,\n  \"totalall\" REAL,\n  \"orderNo\" TEXT,\n  \"transferDetail\" TEXT,\n  \"cashAmount\" REAL,\n  \"transferAmount\" REAL,\n  \"serviceCharge\" REAL,\n  \"serviceChargePercent\" REAL DEFAULT 0,\n  \"discountReason\" TEXT DEFAULT '',\n  \"taxInvoiceNo\" TEXT DEFAULT '',\n  \"vatAmount\" REAL DEFAULT 0,\n  \"beforeVat\" REAL DEFAULT 0\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SaleMain_createDate\" ON \"SaleMain\" (\"createDate\");",
  "CREATE TABLE IF NOT EXISTS \"Sale\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"createDate\" TEXT,\n  \"company\" TEXT,\n  \"id_product\" INTEGER,\n  \"code_product\" TEXT,\n  \"name_product\" TEXT,\n  \"cetagory\" TEXT DEFAULT '',\n  \"fixname\" TEXT,\n  \"unit\" TEXT,\n  \"qty\" REAL,\n  \"subunit\" TEXT DEFAULT '',\n  \"subqty\" REAL DEFAULT 0,\n  \"cost\" REAL DEFAULT 0,\n  \"price\" REAL,\n  \"discount\" REAL DEFAULT 0,\n  \"memberDiscount\" REAL DEFAULT 0,\n  \"memberDiscountPercent\" REAL DEFAULT 0,\n  \"total\" REAL,\n  \"barcode\" TEXT DEFAULT '',\n  \"id_receive1\" REAL,\n  \"lot_receive1\" TEXT,\n  \"qty_lot1\" REAL,\n  \"id_receive2\" REAL,\n  \"lot_receive2\" TEXT,\n  \"qty_lot2\" REAL,\n  \"id_receive3\" REAL,\n  \"lot_receive3\" TEXT,\n  \"qty_lot3\" REAL,\n  \"person\" TEXT,\n  \"statuss\" TEXT,\n  \"type\" TEXT DEFAULT '',\n  \"name_customer\" TEXT DEFAULT '',\n  \"id_card\" TEXT DEFAULT '',\n  \"phone\" TEXT DEFAULT '',\n  \"pharmacy\" TEXT DEFAULT '',\n  \"gifts\" REAL DEFAULT 0,\n  \"id_salemain\" INTEGER NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Sale_company\" ON \"Sale\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Sale_createDate\" ON \"Sale\" (\"createDate\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Sale_id_salemain\" ON \"Sale\" (\"id_salemain\");",
  "CREATE TABLE IF NOT EXISTS \"History\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"createDate\" TEXT,\n  \"company\" TEXT,\n  \"id_costomer\" INTEGER,\n  \"code_costomer\" TEXT,\n  \"name_customer\" TEXT DEFAULT '',\n  \"duedate\" TEXT,\n  \"followup\" TEXT,\n  \"solution\" TEXT,\n  \"duedate1\" TEXT,\n  \"followup1\" TEXT DEFAULT '',\n  \"solution1\" TEXT DEFAULT '',\n  \"duedate2\" TEXT,\n  \"followup2\" TEXT DEFAULT '',\n  \"solution2\" TEXT DEFAULT '',\n  \"id_history\" INTEGER DEFAULT 0,\n  \"count\" INTEGER,\n  \"statusH\" TEXT,\n  \"person\" TEXT,\n  \"remark\" TEXT,\n  \"id_salemain\" INTEGER NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_History_company\" ON \"History\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_History_createDate\" ON \"History\" (\"createDate\");",
  "CREATE INDEX IF NOT EXISTS \"idx_History_id_salemain\" ON \"History\" (\"id_salemain\");",
  "CREATE TABLE IF NOT EXISTS \"Gifts\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"createDate\" TEXT,\n  \"company\" TEXT,\n  \"id_product\" INTEGER,\n  \"code_product\" TEXT,\n  \"name_product\" TEXT,\n  \"gift\" REAL,\n  \"person\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Gifts_company\" ON \"Gifts\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Gifts_createDate\" ON \"Gifts\" (\"createDate\");",
  "CREATE TABLE IF NOT EXISTS \"Indicator\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"list\" TEXT,\n  \"list_lo\" TEXT DEFAULT '',\n  \"list_my\" TEXT DEFAULT '',\n  \"list_km\" TEXT DEFAULT '',\n  \"list_zh\" TEXT DEFAULT '',\n  \"list_eng\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Indicator_company\" ON \"Indicator\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Methodlist\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"list\" TEXT,\n  \"qty\" TEXT,\n  \"unit\" TEXT,\n  \"fullname\" TEXT,\n  \"list_lo\" TEXT DEFAULT '',\n  \"list_my\" TEXT DEFAULT '',\n  \"list_km\" TEXT DEFAULT '',\n  \"list_zh\" TEXT DEFAULT '',\n  \"list_eng\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Methodlist_company\" ON \"Methodlist\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"TimeL\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"list\" TEXT,\n  \"list_lo\" TEXT DEFAULT '',\n  \"list_my\" TEXT DEFAULT '',\n  \"list_km\" TEXT DEFAULT '',\n  \"list_zh\" TEXT DEFAULT '',\n  \"list_eng\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_TimeL_company\" ON \"TimeL\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"UseL\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"list\" TEXT,\n  \"list_lo\" TEXT DEFAULT '',\n  \"list_my\" TEXT DEFAULT '',\n  \"list_km\" TEXT DEFAULT '',\n  \"list_zh\" TEXT DEFAULT '',\n  \"list_eng\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_UseL_company\" ON \"UseL\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"TimeUseL\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"list\" TEXT,\n  \"list_lo\" TEXT DEFAULT '',\n  \"list_my\" TEXT DEFAULT '',\n  \"list_km\" TEXT DEFAULT '',\n  \"list_zh\" TEXT DEFAULT '',\n  \"list_eng\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_TimeUseL_company\" ON \"TimeUseL\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"KeepL\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"list\" TEXT,\n  \"list_lo\" TEXT DEFAULT '',\n  \"list_my\" TEXT DEFAULT '',\n  \"list_km\" TEXT DEFAULT '',\n  \"list_zh\" TEXT DEFAULT '',\n  \"list_eng\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_KeepL_company\" ON \"KeepL\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"RemarkL\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"list\" TEXT,\n  \"list_lo\" TEXT DEFAULT '',\n  \"list_my\" TEXT DEFAULT '',\n  \"list_km\" TEXT DEFAULT '',\n  \"list_zh\" TEXT DEFAULT '',\n  \"list_eng\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_RemarkL_company\" ON \"RemarkL\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Labeldata\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"code\" TEXT,\n  \"indicatorlistS\" TEXT DEFAULT '',\n  \"timeS\" TEXT DEFAULT '',\n  \"useS\" TEXT DEFAULT '',\n  \"timeuseS\" TEXT DEFAULT '',\n  \"keepS\" TEXT DEFAULT '',\n  \"remarkS\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Labeldata_company\" ON \"Labeldata\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_Labeldata_code\" ON \"Labeldata\" (\"code\");",
  "CREATE TABLE IF NOT EXISTS \"GenericLabel\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"fixname\" TEXT,\n  \"shortname\" TEXT DEFAULT '',\n  \"indicatorlistS\" TEXT DEFAULT '',\n  \"timeS\" TEXT DEFAULT '',\n  \"useS\" TEXT DEFAULT '',\n  \"timeuseS\" TEXT DEFAULT '',\n  \"keepS\" TEXT DEFAULT '',\n  \"remarkS\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_GenericLabel_company\" ON \"GenericLabel\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"LabelHelper\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"name\" TEXT DEFAULT '',\n  \"isDefault\" INTEGER NOT NULL DEFAULT 0,\n  \"suspended\" INTEGER NOT NULL DEFAULT 0,\n  \"paperSize\" TEXT DEFAULT '80x50',\n  \"labelStyle\" TEXT DEFAULT 'current',\n  \"title\" TEXT DEFAULT '',\n  \"titleOn\" INTEGER NOT NULL DEFAULT 1,\n  \"titleSize\" INTEGER NOT NULL DEFAULT 14,\n  \"line1\" TEXT DEFAULT '',\n  \"line1On\" INTEGER NOT NULL DEFAULT 1,\n  \"line1Size\" INTEGER NOT NULL DEFAULT 10,\n  \"line2\" TEXT DEFAULT '',\n  \"line2On\" INTEGER NOT NULL DEFAULT 1,\n  \"line2Size\" INTEGER NOT NULL DEFAULT 10,\n  \"line3\" TEXT DEFAULT '',\n  \"line3On\" INTEGER NOT NULL DEFAULT 1,\n  \"line3Size\" INTEGER NOT NULL DEFAULT 10,\n  \"line4\" TEXT DEFAULT '',\n  \"line4On\" INTEGER NOT NULL DEFAULT 1,\n  \"line4Size\" INTEGER NOT NULL DEFAULT 10,\n  \"line5\" TEXT DEFAULT '',\n  \"line5On\" INTEGER NOT NULL DEFAULT 1,\n  \"line5Size\" INTEGER NOT NULL DEFAULT 10,\n  \"line6\" TEXT DEFAULT '',\n  \"line6On\" INTEGER NOT NULL DEFAULT 1,\n  \"line6Size\" INTEGER NOT NULL DEFAULT 10,\n  \"url\" TEXT DEFAULT '',\n  \"showBarcode\" INTEGER NOT NULL DEFAULT 0,\n  \"barcode\" TEXT DEFAULT '',\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_LabelHelper_company\" ON \"LabelHelper\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SettingStore\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"namestore\" TEXT UNIQUE,\n  \"address\" TEXT,\n  \"tel\" TEXT,\n  \"lineid\" TEXT,\n  \"ownerName\" TEXT DEFAULT '',\n  \"taxnumber\" TEXT,\n  \"publiclogo\" TEXT UNIQUE,\n  \"publicline\" TEXT UNIQUE,\n  \"vatEnabled\" TEXT DEFAULT 'false',\n  \"vatRate\" REAL DEFAULT 7,\n  \"branchName\" TEXT DEFAULT '',\n  \"branchCode\" TEXT DEFAULT '',\n  \"blockNegativeStockSale\" TEXT DEFAULT 'false',\n  \"expiryColorRules\" TEXT DEFAULT '[]',\n  \"costPriceMode\" TEXT DEFAULT 'latest'\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SettingStore_company\" ON \"SettingStore\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SettingLabel\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"logo\" TEXT,\n  \"line\" TEXT,\n  \"all\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SettingLabel_company\" ON \"SettingLabel\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Settingpoint\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"sale\" INTEGER,\n  \"pointeq\" INTEGER,\n  \"pointset\" INTEGER,\n  \"discount\" INTEGER,\n  \"status\" TEXT,\n  \"memberDiscountPercent\" REAL NOT NULL DEFAULT 2,\n  \"memberDiscountEnabled\" INTEGER NOT NULL DEFAULT 0\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Settingpoint_company\" ON \"Settingpoint\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Settingpayment\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"bank\" TEXT,\n  \"name\" TEXT,\n  \"bookbankno\" TEXT,\n  \"promtpayno\" TEXT,\n  \"publicId\" TEXT UNIQUE\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Settingpayment_company\" ON \"Settingpayment\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"ReportWorkShift\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT NOT NULL,\n  \"shiftKey\" TEXT NOT NULL,\n  \"name\" TEXT NOT NULL,\n  \"startTime\" TEXT NOT NULL,\n  \"endTime\" TEXT NOT NULL,\n  \"sortOrder\" INTEGER NOT NULL DEFAULT 0,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ReportWorkShift_company\" ON \"ReportWorkShift\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"PaymentProvider\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"provider\" TEXT NOT NULL,\n  \"enabled\" INTEGER NOT NULL DEFAULT 0,\n  \"displayName\" TEXT,\n  \"apiKey\" TEXT,\n  \"secretKey\" TEXT,\n  \"merchantId\" TEXT,\n  \"accountId\" TEXT,\n  \"qrImageUrl\" TEXT,\n  \"webhookUrl\" TEXT,\n  \"serviceChargePercent\" REAL,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_PaymentProvider_company\" ON \"PaymentProvider\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"PaymentTransaction\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"txId\" TEXT NOT NULL UNIQUE,\n  \"company\" TEXT,\n  \"provider\" TEXT,\n  \"amount\" REAL,\n  \"status\" TEXT DEFAULT 'pending',\n  \"reference\" TEXT,\n  \"saleId\" TEXT,\n  \"qrPayload\" TEXT,\n  \"rawPayload\" TEXT,\n  \"paidAt\" TEXT,\n  \"expiresAt\" TEXT,\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_PaymentTransaction_company\" ON \"PaymentTransaction\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Promotion\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"name_promotion\" TEXT,\n  \"customer\" TEXT,\n  \"conditionid\" INTEGER,\n  \"condition\" TEXT,\n  \"startdate\" TEXT,\n  \"enddate\" TEXT,\n  \"unit\" TEXT,\n  \"pay_condition\" INTEGER,\n  \"discount\" INTEGER,\n  \"msg_condition\" TEXT,\n  \"msg_discount\" TEXT,\n  \"status\" TEXT,\n  \"person\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Promotion_company\" ON \"Promotion\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"ProductPromotion\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"name\" TEXT,\n  \"id_product\" INTEGER,\n  \"code_product\" TEXT,\n  \"name_product\" TEXT,\n  \"unit\" TEXT,\n  \"price_tier\" TEXT DEFAULT 'ทุกระดับราคา',\n  \"promo_type\" TEXT DEFAULT 'discount',\n  \"min_qty\" REAL DEFAULT 0,\n  \"discount_unit\" TEXT DEFAULT 'baht',\n  \"discount_scope\" TEXT DEFAULT 'unit',\n  \"discount_value\" REAL DEFAULT 0,\n  \"free_qty\" REAL DEFAULT 0,\n  \"startdate\" TEXT,\n  \"enddate\" TEXT,\n  \"status\" TEXT DEFAULT 'active',\n  \"person\" TEXT,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ProductPromotion_company\" ON \"ProductPromotion\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Label_language\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"list\" TEXT,\n  \"list_lo\" TEXT DEFAULT '',\n  \"list_my\" TEXT DEFAULT '',\n  \"list_km\" TEXT DEFAULT '',\n  \"list_zh\" TEXT DEFAULT '',\n  \"list_eng\" TEXT DEFAULT ''\n);",
  "CREATE TABLE IF NOT EXISTS \"DocMain\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"createDate\" TEXT,\n  \"id_costomer\" INTEGER,\n  \"code_costomer\" TEXT,\n  \"name_costomer\" TEXT,\n  \"group_price\" TEXT,\n  \"pay\" TEXT,\n  \"bill\" INTEGER,\n  \"discount\" REAL,\n  \"sumtotal\" REAL,\n  \"addreward\" REAL,\n  \"usereward\" REAL,\n  \"companyall\" TEXT,\n  \"personall\" TEXT,\n  \"statussall\" TEXT,\n  \"totalall\" REAL,\n  \"taxnumber\" TEXT,\n  \"qt_date\" TEXT,\n  \"qt_enddate\" TEXT,\n  \"qt_credit\" INTEGER,\n  \"qt_number\" INTEGER,\n  \"qt_orderNo\" TEXT,\n  \"qt_orderfull\" TEXT,\n  \"qt_status\" TEXT,\n  \"qt_person\" TEXT,\n  \"qt_remark\" TEXT,\n  \"bl_date\" TEXT,\n  \"bl_enddate\" TEXT,\n  \"bl_number\" INTEGER,\n  \"bl_orderNo\" TEXT,\n  \"bl_orderfull\" TEXT,\n  \"bl_status\" TEXT,\n  \"bl_credit\" INTEGER,\n  \"bl_person\" TEXT,\n  \"bl_remark\" TEXT,\n  \"inv_date\" TEXT,\n  \"inv_enddate\" TEXT,\n  \"inv_number\" INTEGER,\n  \"inv_orderNo\" TEXT,\n  \"inv_orderfull\" TEXT,\n  \"inv_status\" TEXT,\n  \"inv_credit\" INTEGER,\n  \"inv_person\" TEXT,\n  \"inv_remark\" TEXT,\n  \"re_date\" TEXT,\n  \"re_enddate\" TEXT,\n  \"re_number\" INTEGER,\n  \"re_orderNo\" TEXT,\n  \"re_orderfull\" TEXT,\n  \"re_status\" TEXT,\n  \"re_credit\" INTEGER,\n  \"re_person\" TEXT,\n  \"re_remark\" TEXT,\n  \"dn_date\" TEXT,\n  \"dn_enddate\" TEXT,\n  \"dn_number\" INTEGER,\n  \"dn_orderNo\" TEXT,\n  \"dn_orderfull\" TEXT,\n  \"dn_status\" TEXT,\n  \"dn_credit\" INTEGER,\n  \"dn_person\" TEXT,\n  \"dn_remark\" TEXT,\n  \"dn_paytype\" TEXT,\n  \"dn_deposit\" REAL,\n  \"dn_balance\" REAL,\n  \"tax_date\" TEXT,\n  \"tax_enddate\" TEXT,\n  \"tax_number\" INTEGER,\n  \"tax_orderNo\" TEXT,\n  \"tax_orderfull\" TEXT,\n  \"tax_status\" TEXT,\n  \"tax_credit\" INTEGER,\n  \"tax_person\" TEXT,\n  \"tax_remark\" TEXT,\n  \"debit_date\" TEXT,\n  \"debit_enddate\" TEXT,\n  \"debit_number\" INTEGER,\n  \"debit_orderNo\" TEXT,\n  \"debit_orderfull\" TEXT,\n  \"debit_status\" TEXT,\n  \"debit_credit\" INTEGER,\n  \"debit_person\" TEXT,\n  \"debit_remark\" TEXT,\n  \"debit_reference_no\" TEXT,\n  \"debit_reason\" TEXT,\n  \"debit_original_amount\" REAL,\n  \"debit_correct_amount\" REAL,\n  \"debit_difference_amount\" REAL,\n  \"debit_vat_rate\" INTEGER,\n  \"debit_vat_amount\" REAL,\n  \"debit_grand_total\" REAL,\n  \"credit_date\" TEXT,\n  \"credit_enddate\" TEXT,\n  \"credit_number\" INTEGER,\n  \"credit_orderNo\" TEXT,\n  \"credit_orderfull\" TEXT,\n  \"credit_status\" TEXT,\n  \"credit_credit\" INTEGER,\n  \"credit_person\" TEXT,\n  \"credit_remark\" TEXT,\n  \"credit_reference_no\" TEXT,\n  \"credit_reference_book_no\" TEXT,\n  \"credit_reason\" TEXT,\n  \"credit_item_name\" TEXT,\n  \"credit_item_qty\" REAL,\n  \"credit_items_json\" TEXT,\n  \"credit_original_amount\" REAL,\n  \"credit_correct_amount\" REAL,\n  \"credit_difference_amount\" REAL,\n  \"credit_reduce_amount\" REAL,\n  \"credit_vat_rate\" INTEGER,\n  \"credit_vat_amount\" REAL,\n  \"credit_net_total\" REAL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_DocMain_createDate\" ON \"DocMain\" (\"createDate\");",
  "CREATE TABLE IF NOT EXISTS \"DocDetail\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"createDate\" TEXT,\n  \"company\" TEXT,\n  \"id_product\" INTEGER,\n  \"code_product\" TEXT,\n  \"name_product\" TEXT,\n  \"cetagory\" TEXT DEFAULT '',\n  \"unit\" TEXT,\n  \"qty\" REAL,\n  \"cost\" REAL DEFAULT 0,\n  \"price\" REAL,\n  \"discount\" REAL DEFAULT 0,\n  \"total\" REAL,\n  \"person\" TEXT,\n  \"statuss\" TEXT,\n  \"id_docmain\" INTEGER NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_DocDetail_company\" ON \"DocDetail\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_DocDetail_createDate\" ON \"DocDetail\" (\"createDate\");",
  "CREATE INDEX IF NOT EXISTS \"idx_DocDetail_id_docmain\" ON \"DocDetail\" (\"id_docmain\");",
  "CREATE TABLE IF NOT EXISTS \"PL\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"month\" TEXT,\n  \"year\" TEXT,\n  \"monthyear\" TEXT,\n  \"R4000\" REAL,\n  \"R4001\" REAL,\n  \"R4002\" REAL,\n  \"C5000\" REAL,\n  \"C5001\" REAL,\n  \"S6000\" REAL,\n  \"S6001\" REAL,\n  \"S6002\" REAL,\n  \"S6003\" REAL,\n  \"S6004\" REAL,\n  \"S6005\" REAL,\n  \"S6006\" REAL,\n  \"S6007\" REAL,\n  \"S6008\" REAL,\n  \"S6009\" REAL,\n  \"S6010\" REAL,\n  \"A7000\" REAL,\n  \"A7001\" REAL,\n  \"A7002\" REAL,\n  \"A7003\" REAL,\n  \"A7004\" REAL,\n  \"A7005\" REAL,\n  \"A7006\" REAL,\n  \"A7007\" REAL,\n  \"vat\" REAL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_PL_company\" ON \"PL\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Interaction\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"fixname1\" TEXT,\n  \"fixname2\" TEXT,\n  \"status\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Interaction_company\" ON \"Interaction\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"Level\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT\n);",
  "CREATE TABLE IF NOT EXISTS \"MainLevel\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"codename\" TEXT DEFAULT '',\n  \"main\" TEXT DEFAULT '',\n  \"list\" TEXT DEFAULT '',\n  \"level1\" INTEGER DEFAULT 1,\n  \"level2\" INTEGER DEFAULT 1,\n  \"level3\" INTEGER DEFAULT 1,\n  \"levelId\" INTEGER NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_MainLevel_company\" ON \"MainLevel\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_MainLevel_levelId\" ON \"MainLevel\" (\"levelId\");",
  "CREATE TABLE IF NOT EXISTS \"EmployeePermission\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"employeeId\" INTEGER NOT NULL,\n  \"codename\" TEXT NOT NULL,\n  \"allowed\" INTEGER NOT NULL DEFAULT 1\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_EmployeePermission_employeeId\" ON \"EmployeePermission\" (\"employeeId\");",
  "CREATE TABLE IF NOT EXISTS \"Checkin\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"idcompany\" TEXT DEFAULT '',\n  \"company\" TEXT DEFAULT '',\n  \"personId\" INTEGER DEFAULT 0,\n  \"person\" TEXT DEFAULT '',\n  \"status\" TEXT DEFAULT '',\n  \"checkin\" TEXT,\n  \"checkout\" TEXT,\n  \"checkinLat\" REAL DEFAULT 0,\n  \"checkinLng\" REAL DEFAULT 0,\n  \"checkoutLat\" REAL DEFAULT 0,\n  \"checkoutLng\" REAL DEFAULT 0,\n  \"gpsRadius\" REAL DEFAULT 10,\n  \"targetLat\" REAL DEFAULT 0,\n  \"targetLng\" REAL DEFAULT 0,\n  \"approve\" TEXT DEFAULT '',\n  \"approveDate\" TEXT,\n  \"approvePerson\" TEXT DEFAULT '',\n  \"remark\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_Checkin_company\" ON \"Checkin\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"CheckinSet\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"idcompany\" TEXT DEFAULT '',\n  \"names\" TEXT DEFAULT '',\n  \"radius\" REAL DEFAULT 100,\n  \"latitude\" REAL DEFAULT 0,\n  \"longitude\" REAL DEFAULT 0,\n  \"createdAt\" TEXT\n);",
  "CREATE TABLE IF NOT EXISTS \"CheckinDevice\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"idcompany\" TEXT DEFAULT '',\n  \"deviceId\" TEXT NOT NULL UNIQUE,\n  \"name\" TEXT DEFAULT '',\n  \"branch\" TEXT DEFAULT '',\n  \"deviceType\" TEXT DEFAULT 'Web',\n  \"status\" TEXT DEFAULT 'active',\n  \"registeredBy\" TEXT DEFAULT '',\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS \"Checkstock\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"date\" TEXT,\n  \"month\" TEXT DEFAULT '',\n  \"idcompany\" TEXT DEFAULT '',\n  \"id_product\" INTEGER,\n  \"name_product\" TEXT DEFAULT '',\n  \"balance\" REAL DEFAULT 0,\n  \"actual\" REAL DEFAULT 0,\n  \"diff\" REAL DEFAULT 0,\n  \"person\" TEXT DEFAULT '',\n  \"status\" TEXT DEFAULT ''\n);",
  "CREATE TABLE IF NOT EXISTS \"RCstockchange\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"codenames\" TEXT,\n  \"itemcode\" TEXT,\n  \"itemName\" TEXT,\n  \"unit\" TEXT,\n  \"createDate\" TEXT,\n  \"newCost\" REAL,\n  \"qty\" REAL,\n  \"totalcost\" REAL,\n  \"lot\" TEXT,\n  \"dateExp\" TEXT,\n  \"freebaht\" REAL,\n  \"discountbaht\" REAL,\n  \"sale\" REAL,\n  \"Barcode\" TEXT,\n  \"type\" TEXT,\n  \"person\" TEXT,\n  \"statuss\" TEXT,\n  \"dateRC\" TEXT,\n  \"balance\" REAL,\n  \"codevender\" TEXT DEFAULT '',\n  \"namevender\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_RCstockchange_company\" ON \"RCstockchange\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_RCstockchange_Barcode\" ON \"RCstockchange\" (\"Barcode\");",
  "CREATE INDEX IF NOT EXISTS \"idx_RCstockchange_createDate\" ON \"RCstockchange\" (\"createDate\");",
  "CREATE TABLE IF NOT EXISTS \"StockTransaction\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"product_id\" INTEGER,\n  \"inventory_lot_id\" INTEGER,\n  \"itemcode\" TEXT,\n  \"itemName\" TEXT,\n  \"lot\" TEXT,\n  \"dateExp\" TEXT,\n  \"quantity_change\" REAL,\n  \"balance_after\" REAL,\n  \"transaction_type\" TEXT,\n  \"createDate\" TEXT,\n  \"company\" TEXT,\n  \"person\" TEXT,\n  \"personsale\" TEXT NOT NULL DEFAULT '',\n  \"receiverCompany\" TEXT,\n  \"adjustReasonMain\" TEXT,\n  \"receiverCompanyName\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_StockTransaction_company\" ON \"StockTransaction\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_StockTransaction_createDate\" ON \"StockTransaction\" (\"createDate\");",
  "CREATE TABLE IF NOT EXISTS \"OrderMain\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"createDate\" TEXT,\n  \"company\" TEXT,\n  \"orderNo\" TEXT DEFAULT '',\n  \"orderfull\" TEXT DEFAULT '',\n  \"supplierId\" INTEGER,\n  \"supplierCode\" TEXT,\n  \"supplierName\" TEXT,\n  \"totalAmount\" REAL DEFAULT 0,\n  \"status\" TEXT DEFAULT 'Pending',\n  \"person\" TEXT,\n  \"remark\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_OrderMain_company\" ON \"OrderMain\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_OrderMain_createDate\" ON \"OrderMain\" (\"createDate\");",
  "CREATE TABLE IF NOT EXISTS \"OrderDetail\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"orderId\" INTEGER NOT NULL,\n  \"itemcode\" TEXT,\n  \"itemName\" TEXT,\n  \"qty\" REAL,\n  \"unit\" TEXT DEFAULT '',\n  \"cost\" REAL DEFAULT 0,\n  \"total\" REAL DEFAULT 0,\n  \"status\" TEXT DEFAULT 'Pending'\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_OrderDetail_orderId\" ON \"OrderDetail\" (\"orderId\");",
  "CREATE TABLE IF NOT EXISTS \"IncentiveSetting\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"targetMonthly\" REAL DEFAULT 300000,\n  \"targetMonthlyBonus\" REAL DEFAULT 1000,\n  \"targetDaysOver\" REAL DEFAULT 13,\n  \"targetDaysOverBonus\" REAL DEFAULT 750,\n  \"targetAmountOver\" REAL DEFAULT 10000,\n  \"targetAmountOverBonus\" REAL DEFAULT 0,\n  \"targetDaily\" REAL DEFAULT 12000,\n  \"targetDailyBonus\" REAL DEFAULT 80,\n  \"pickupFeeRate\" REAL DEFAULT 0.5,\n  \"pickupFeeBonus\" REAL DEFAULT 0,\n  \"salesPerBillTarget\" REAL DEFAULT 120,\n  \"salesPerBillBonus\" REAL DEFAULT 20,\n  \"enableTargetMonthly\" INTEGER NOT NULL DEFAULT 1,\n  \"enableTargetDaysOver\" INTEGER NOT NULL DEFAULT 1,\n  \"enableTargetDaily\" INTEGER NOT NULL DEFAULT 1,\n  \"enablePickupFee\" INTEGER NOT NULL DEFAULT 1,\n  \"enableSalesPerBill\" INTEGER NOT NULL DEFAULT 1,\n  \"createdAt\" TEXT,\n  \"updatedAt\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_IncentiveSetting_company\" ON \"IncentiveSetting\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"BranchConnection\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"fromUserId\" INTEGER NOT NULL,\n  \"toUserId\" INTEGER,\n  \"remoteUserId\" INTEGER,\n  \"remoteCompany\" TEXT,\n  \"status\" TEXT NOT NULL DEFAULT 'accepted',\n  \"tunnelUrl\" TEXT,\n  \"apiToken\" TEXT,\n  \"branchName\" TEXT,\n  \"lastCheckedAt\" TEXT,\n  \"isOnline\" INTEGER NOT NULL DEFAULT 0,\n  \"requestedAt\" TEXT NOT NULL,\n  \"respondedAt\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_BranchConnection_fromUserId\" ON \"BranchConnection\" (\"fromUserId\");",
  "CREATE INDEX IF NOT EXISTS \"idx_BranchConnection_toUserId\" ON \"BranchConnection\" (\"toUserId\");",
  "CREATE TABLE IF NOT EXISTS \"StockTransfer\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"transferNo\" TEXT,\n  \"fromUserId\" INTEGER NOT NULL,\n  \"toUserId\" INTEGER NOT NULL,\n  \"transferMode\" TEXT NOT NULL DEFAULT 'connected',\n  \"status\" TEXT NOT NULL DEFAULT 'pending',\n  \"createdAt\" TEXT NOT NULL,\n  \"completedAt\" TEXT,\n  \"person\" TEXT,\n  \"remark\" TEXT,\n  \"fromBranchNameSnapshot\" TEXT,\n  \"fromBranchEmailSnapshot\" TEXT,\n  \"toBranchNameSnapshot\" TEXT,\n  \"toBranchEmailSnapshot\" TEXT,\n  \"toBranchDetailSnapshot\" TEXT\n);",
  "CREATE TABLE IF NOT EXISTS \"StockTransferItem\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"transferId\" INTEGER NOT NULL,\n  \"itemcode\" TEXT,\n  \"itemName\" TEXT,\n  \"lotId\" INTEGER,\n  \"lot\" TEXT,\n  \"dateExp\" TEXT,\n  \"qty\" REAL,\n  \"cost\" REAL,\n  \"confirmedQty\" REAL,\n  \"itemStatus\" TEXT NOT NULL DEFAULT 'pending',\n  \"personsale\" TEXT NOT NULL DEFAULT '',\n  \"barcode\" TEXT,\n  \"unit\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_StockTransferItem_transferId\" ON \"StockTransferItem\" (\"transferId\");",
  "CREATE TABLE IF NOT EXISTS \"UnitConversion\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"productCode\" TEXT,\n  \"qty\" INTEGER DEFAULT 1,\n  \"saleUnit\" TEXT,\n  \"subQty\" REAL DEFAULT 12,\n  \"subUnit\" TEXT,\n  \"priceRetail\" REAL,\n  \"priceWholesale\" REAL,\n  \"priceOnline\" REAL,\n  \"priceA\" REAL,\n  \"priceB\" REAL,\n  \"priceC\" REAL,\n  \"priceD\" REAL,\n  \"priceE\" REAL,\n  \"priceF\" REAL,\n  \"priceG\" REAL,\n  \"priceH\" REAL,\n  \"Barcode\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_UnitConversion_company\" ON \"UnitConversion\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_UnitConversion_Barcode\" ON \"UnitConversion\" (\"Barcode\");",
  "CREATE TABLE IF NOT EXISTS \"TemperatureRecord\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"recordDate\" TEXT,\n  \"recordPoint\" INTEGER,\n  \"recordTime\" INTEGER,\n  \"temperature\" REAL,\n  \"humidity\" REAL,\n  \"locationType\" TEXT,\n  \"person\" TEXT,\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_TemperatureRecord_company\" ON \"TemperatureRecord\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"TemperatureSetting\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"roomTempMin\" REAL DEFAULT 0,\n  \"roomTempMax\" REAL DEFAULT 30,\n  \"roomHumidMin\" REAL DEFAULT 30,\n  \"roomHumidMax\" REAL DEFAULT 50,\n  \"fridgeTempMin\" REAL DEFAULT 2,\n  \"fridgeTempMax\" REAL DEFAULT 8,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_TemperatureSetting_company\" ON \"TemperatureSetting\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"LeaveConfig\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"idcompany\" TEXT DEFAULT '',\n  \"vacationDays\" INTEGER DEFAULT 6,\n  \"personalDays\" INTEGER DEFAULT 3,\n  \"sickDays\" INTEGER DEFAULT 30,\n  \"lateLimit\" INTEGER DEFAULT 3,\n  \"workStartTime\" TEXT DEFAULT '08:30',\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS \"LeaveRecord\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"idcompany\" TEXT DEFAULT '',\n  \"personId\" INTEGER DEFAULT 0,\n  \"person\" TEXT DEFAULT '',\n  \"leaveType\" TEXT DEFAULT '',\n  \"leaveDate\" TEXT,\n  \"reason\" TEXT DEFAULT '',\n  \"status\" TEXT DEFAULT 'pending',\n  \"rejectReason\" TEXT DEFAULT '',\n  \"approvedBy\" TEXT DEFAULT '',\n  \"approvedDate\" TEXT,\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS \"TemperaturePoint\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"pointNumber\" INTEGER,\n  \"pointName\" TEXT,\n  \"detail\" TEXT,\n  \"locationType\" TEXT,\n  \"isActive\" INTEGER NOT NULL DEFAULT 1,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_TemperaturePoint_company\" ON \"TemperaturePoint\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SyncLog\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"targetBranch\" TEXT,\n  \"branchName\" TEXT,\n  \"syncType\" TEXT,\n  \"recordCount\" INTEGER DEFAULT 0,\n  \"created\" INTEGER DEFAULT 0,\n  \"updated\" INTEGER DEFAULT 0,\n  \"status\" TEXT DEFAULT 'pending',\n  \"error\" TEXT,\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SyncLog_company\" ON \"SyncLog\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"UserActionLog\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"personId\" INTEGER,\n  \"personName\" TEXT DEFAULT 'ไม่ทราบผู้ใช้',\n  \"actionType\" TEXT NOT NULL,\n  \"entityType\" TEXT NOT NULL,\n  \"entityId\" TEXT,\n  \"entityCode\" TEXT,\n  \"route\" TEXT,\n  \"buttonLabel\" TEXT,\n  \"status\" TEXT NOT NULL DEFAULT 'success',\n  \"message\" TEXT,\n  \"errorMessage\" TEXT,\n  \"metadata\" TEXT,\n  \"durationMs\" INTEGER,\n  \"sessionId\" TEXT,\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_UserActionLog_company\" ON \"UserActionLog\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SyncSchedule\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"intervalMinutes\" INTEGER DEFAULT 60,\n  \"syncTypes\" TEXT DEFAULT 'datalist,labeldata,supplier',\n  \"targetBranches\" TEXT,\n  \"enabled\" INTEGER NOT NULL DEFAULT 0,\n  \"lastRunAt\" TEXT,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SyncSchedule_company\" ON \"SyncSchedule\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"UsageLabelGroup\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT,\n  \"groupName\" TEXT,\n  \"shortName\" TEXT DEFAULT '',\n  \"useS\" TEXT DEFAULT '',\n  \"timeS\" TEXT DEFAULT '',\n  \"timeuseS\" TEXT DEFAULT '',\n  \"keepS\" TEXT DEFAULT '',\n  \"remarkS\" TEXT DEFAULT ''\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_UsageLabelGroup_company\" ON \"UsageLabelGroup\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"OtRequest\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"idcompany\" TEXT DEFAULT '',\n  \"personId\" INTEGER DEFAULT 0,\n  \"person\" TEXT DEFAULT '',\n  \"otDate\" TEXT,\n  \"startTime\" TEXT DEFAULT '',\n  \"endTime\" TEXT DEFAULT '',\n  \"hours\" REAL DEFAULT 0,\n  \"reason\" TEXT DEFAULT '',\n  \"status\" TEXT DEFAULT 'pending',\n  \"rejectReason\" TEXT DEFAULT '',\n  \"approvedBy\" TEXT DEFAULT '',\n  \"approvedDate\" TEXT,\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS \"ChatChannel\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT DEFAULT '',\n  \"platform\" TEXT NOT NULL,\n  \"channelName\" TEXT DEFAULT '',\n  \"accessToken\" TEXT DEFAULT '',\n  \"channelSecret\" TEXT DEFAULT '',\n  \"pageId\" TEXT DEFAULT '',\n  \"webhookUrl\" TEXT DEFAULT '',\n  \"isActive\" INTEGER NOT NULL DEFAULT 1,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ChatChannel_company\" ON \"ChatChannel\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"ChatContact\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT DEFAULT '',\n  \"channelId\" INTEGER NOT NULL,\n  \"platformUserId\" TEXT NOT NULL,\n  \"displayName\" TEXT DEFAULT '',\n  \"avatarUrl\" TEXT DEFAULT '',\n  \"phone\" TEXT DEFAULT '',\n  \"email\" TEXT DEFAULT '',\n  \"tags\" TEXT DEFAULT '',\n  \"consentGiven\" INTEGER NOT NULL DEFAULT 0,\n  \"consentDate\" TEXT,\n  \"lastMessageAt\" TEXT,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ChatContact_company\" ON \"ChatContact\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_ChatContact_channelId\" ON \"ChatContact\" (\"channelId\");",
  "CREATE TABLE IF NOT EXISTS \"ChatConversation\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT DEFAULT '',\n  \"contactId\" INTEGER NOT NULL,\n  \"assignedTo\" TEXT DEFAULT '',\n  \"status\" TEXT NOT NULL DEFAULT 'open',\n  \"subject\" TEXT DEFAULT '',\n  \"priority\" TEXT DEFAULT 'normal',\n  \"lastMessageAt\" TEXT,\n  \"closedAt\" TEXT,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ChatConversation_company\" ON \"ChatConversation\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_ChatConversation_contactId\" ON \"ChatConversation\" (\"contactId\");",
  "CREATE TABLE IF NOT EXISTS \"ChatMessage\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"conversationId\" INTEGER NOT NULL,\n  \"senderType\" TEXT NOT NULL,\n  \"senderName\" TEXT DEFAULT '',\n  \"messageType\" TEXT NOT NULL DEFAULT 'text',\n  \"content\" TEXT DEFAULT '',\n  \"mediaUrl\" TEXT DEFAULT '',\n  \"metadata\" TEXT DEFAULT '{}',\n  \"isRead\" INTEGER NOT NULL DEFAULT 0,\n  \"readAt\" TEXT,\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ChatMessage_conversationId\" ON \"ChatMessage\" (\"conversationId\");",
  "CREATE TABLE IF NOT EXISTS \"VideoCall\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT DEFAULT '',\n  \"conversationId\" INTEGER NOT NULL,\n  \"roomId\" TEXT NOT NULL UNIQUE,\n  \"initiatedBy\" TEXT DEFAULT '',\n  \"status\" TEXT NOT NULL DEFAULT 'pending',\n  \"startedAt\" TEXT,\n  \"endedAt\" TEXT,\n  \"duration\" INTEGER DEFAULT 0,\n  \"recordingUrl\" TEXT DEFAULT '',\n  \"notes\" TEXT DEFAULT '',\n  \"consentGiven\" INTEGER NOT NULL DEFAULT 0,\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_VideoCall_company\" ON \"VideoCall\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_VideoCall_conversationId\" ON \"VideoCall\" (\"conversationId\");",
  "CREATE TABLE IF NOT EXISTS \"ChatQuickReply\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT DEFAULT '',\n  \"title\" TEXT DEFAULT '',\n  \"content\" TEXT DEFAULT '',\n  \"category\" TEXT DEFAULT '',\n  \"shortcut\" TEXT DEFAULT '',\n  \"createdAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_ChatQuickReply_company\" ON \"ChatQuickReply\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"TelegramBinding\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT NOT NULL,\n  \"branchId\" INTEGER,\n  \"chatId\" TEXT NOT NULL DEFAULT '',\n  \"chatTitle\" TEXT DEFAULT '',\n  \"chatType\" TEXT DEFAULT '',\n  \"notifySale\" INTEGER NOT NULL DEFAULT 1,\n  \"notifyCancel\" INTEGER NOT NULL DEFAULT 1,\n  \"notifyHourly\" INTEGER NOT NULL DEFAULT 1,\n  \"notifyDaily\" INTEGER NOT NULL DEFAULT 1,\n  \"minAmount\" REAL NOT NULL DEFAULT 0,\n  \"quietStart\" TEXT DEFAULT '',\n  \"quietEnd\" TEXT DEFAULT '',\n  \"bindToken\" TEXT NOT NULL UNIQUE,\n  \"bindExpiresAt\" TEXT,\n  \"isActive\" INTEGER NOT NULL DEFAULT 0,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_TelegramBinding_company\" ON \"TelegramBinding\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"TelegramNotifyLog\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"bindingId\" INTEGER NOT NULL,\n  \"eventType\" TEXT NOT NULL,\n  \"refType\" TEXT DEFAULT '',\n  \"refId\" INTEGER,\n  \"payload\" TEXT DEFAULT '',\n  \"success\" INTEGER NOT NULL DEFAULT 0,\n  \"error\" TEXT DEFAULT '',\n  \"sentAt\" TEXT NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS \"DailyClose\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT NOT NULL,\n  \"closeDate\" TEXT NOT NULL,\n  \"workTimeStart\" TEXT,\n  \"workTimeEnd\" TEXT,\n  \"salesTotal\" REAL NOT NULL DEFAULT 0,\n  \"promptpayTotal\" REAL NOT NULL DEFAULT 0,\n  \"transferTotal\" REAL NOT NULL DEFAULT 0,\n  \"cashTotal\" REAL NOT NULL DEFAULT 0,\n  \"otherTotal\" REAL NOT NULL DEFAULT 0,\n  \"cashDeliver\" REAL NOT NULL DEFAULT 0,\n  \"note\" TEXT,\n  \"b1000\" INTEGER NOT NULL DEFAULT 0,\n  \"b500\" INTEGER NOT NULL DEFAULT 0,\n  \"b100\" INTEGER NOT NULL DEFAULT 0,\n  \"b50\" INTEGER NOT NULL DEFAULT 0,\n  \"b20\" INTEGER NOT NULL DEFAULT 0,\n  \"b10\" INTEGER NOT NULL DEFAULT 0,\n  \"b5\" INTEGER NOT NULL DEFAULT 0,\n  \"b2\" INTEGER NOT NULL DEFAULT 0,\n  \"b1\" INTEGER NOT NULL DEFAULT 0,\n  \"totalCounted\" REAL NOT NULL DEFAULT 0,\n  \"diff\" REAL NOT NULL DEFAULT 0,\n  \"changeAmount\" REAL NOT NULL DEFAULT 0,\n  \"drawerBalance\" REAL NOT NULL DEFAULT 0,\n  \"employeeName\" TEXT NOT NULL DEFAULT '',\n  \"branchName\" TEXT,\n  \"status\" TEXT NOT NULL DEFAULT 'draft',\n  \"createdBy\" TEXT,\n  \"updatedBy\" TEXT,\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_DailyClose_company\" ON \"DailyClose\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SelfhealRcitemlistSaleLog\" (\n  \"log_id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"fixed_at\" TEXT NOT NULL,\n  \"rc_id\" INTEGER NOT NULL,\n  \"company\" TEXT,\n  \"itemcode\" TEXT,\n  \"lot\" TEXT,\n  \"qty\" REAL,\n  \"freebaht\" REAL,\n  \"old_sale\" REAL,\n  \"new_sale\" REAL,\n  \"balance\" REAL\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SelfhealRcitemlistSaleLog_company\" ON \"SelfhealRcitemlistSaleLog\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SelfhealRcitemlistDatercLog\" (\n  \"log_id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"fixed_at\" TEXT NOT NULL,\n  \"rc_id\" INTEGER NOT NULL,\n  \"company\" TEXT,\n  \"codenames\" TEXT,\n  \"itemcode\" TEXT,\n  \"lot\" TEXT,\n  \"old_daterc\" TEXT,\n  \"new_daterc\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SelfhealRcitemlistDatercLog_company\" ON \"SelfhealRcitemlistDatercLog\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SelfhealLotRelinkLog\" (\n  \"log_id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"fixed_at\" TEXT NOT NULL,\n  \"company\" TEXT,\n  \"itemcode\" TEXT,\n  \"person\" TEXT,\n  \"kind\" TEXT NOT NULL,\n  \"ref_id\" INTEGER NOT NULL,\n  \"before\" TEXT,\n  \"after\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SelfhealLotRelinkLog_company\" ON \"SelfhealLotRelinkLog\" (\"company\");",
  "CREATE TABLE IF NOT EXISTS \"SaleQueue\" (\n  \"id\" INTEGER PRIMARY KEY AUTOINCREMENT,\n  \"company\" TEXT NOT NULL,\n  \"branch\" TEXT DEFAULT '',\n  \"queueNo\" INTEGER NOT NULL,\n  \"queueDate\" TEXT NOT NULL,\n  \"orderNo\" TEXT,\n  \"id_salemain\" INTEGER,\n  \"customer\" TEXT DEFAULT '',\n  \"seller\" TEXT DEFAULT '',\n  \"itemCount\" INTEGER NOT NULL DEFAULT 0,\n  \"totalAmount\" REAL NOT NULL DEFAULT 0,\n  \"items\" TEXT,\n  \"status\" TEXT NOT NULL DEFAULT 'waiting',\n  \"note\" TEXT DEFAULT '',\n  \"createdAt\" TEXT NOT NULL,\n  \"updatedAt\" TEXT NOT NULL,\n  \"readyAt\" TEXT,\n  \"doneAt\" TEXT\n);",
  "CREATE INDEX IF NOT EXISTS \"idx_SaleQueue_company\" ON \"SaleQueue\" (\"company\");",
  "CREATE INDEX IF NOT EXISTS \"idx_SaleQueue_id_salemain\" ON \"SaleQueue\" (\"id_salemain\");"
]

/** เพิ่มเลขนี้เมื่อ schema เปลี่ยน เพื่อให้ตัว migrate รู้ว่าต้องรัน DDL ใหม่ */
export const SCHEMA_VERSION = 1
