import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const backupData = await req.json()

    if (!backupData?.metadata?.company || !backupData?.data) {
      return NextResponse.json(
        { error: "Invalid backup file format" },
        { status: 400 }
      )
    }

    const sourceCompany = String(backupData.metadata.company)
    const targetCompany = backupData.targetCompany ? String(backupData.targetCompany) : sourceCompany
    const restoreToLoggedCompany = Boolean(backupData.targetCompany)
    const company = targetCompany
    const data = backupData.data
    const targetCompanyId = Number(targetCompany)
    let targetUser: any = null
    const hasEmployeeBackup = Array.isArray(data?.SettingEmployee) && data.SettingEmployee.length > 0

    if (restoreToLoggedCompany) {
      if (!Number.isInteger(targetCompanyId) || targetCompanyId <= 0) {
        return NextResponse.json(
          { error: "Invalid target company id" },
          { status: 400 }
        )
      }

      targetUser = await (prisma as any).user.findUnique({
        where: { id: targetCompanyId },
        select: { id: true, company: true },
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: "Target company user not found" },
          { status: 400 }
        )
      }

      const setRecordsField = (tableName: string, field: string, value: any) => {
        const records = data?.[tableName]
        if (!Array.isArray(records)) return
        for (const record of records) {
          if (record && typeof record === "object") {
            record[field] = value
          }
        }
      }

      const companyTables = [
        "Getagory", "Group", "Fixname", "Type", "Unit", "Area",
        "Datalist", "Customer", "Drugallergy", "Supplier",
        "Receive", "RCitemlist", "Sale", "History", "Gifts",
        "Indicator", "Methodlist", "TimeL", "UseL", "TimeUseL",
        "KeepL", "RemarkL", "Labeldata", "SettingStore", "SettingLabel",
        "Settingpoint", "Settingpayment", "PaymentProvider", "PaymentTransaction",
        "Promotion", "DocDetail", "PL", "Interaction", "MainLevel",
        "RCstockchange", "StockTransaction", "OrderMain", "IncentiveSetting",
        "UnitConversion", "TemperatureRecord", "TemperatureSetting",
        "TemperaturePoint", "SyncLog", "SyncSchedule",
      ]

      for (const tableName of companyTables) {
        setRecordsField(tableName, "company", targetCompany)
      }

      for (const tableName of ["SaleMain", "DocMain"]) {
        setRecordsField(tableName, "companyall", targetCompany)
      }

      for (const tableName of ["Checkin", "CheckinSet", "Checkstock", "LeaveConfig", "LeaveRecord"]) {
        setRecordsField(tableName, "idcompany", targetCompany)
      }

      setRecordsField("SettingEmployee", "id_company", targetCompanyId)
      if (targetUser.company) {
        setRecordsField("SettingEmployee", "company", targetUser.company)
        setRecordsField("Checkin", "company", targetUser.company)
      }
    }

    // Get user IDs for this company to delete related records
    const existingUsers = restoreToLoggedCompany
      ? [{ id: targetCompanyId }]
      : await (prisma as any).user.findMany({
        where: Number.isInteger(targetCompanyId) && targetCompanyId > 0 ? { id: targetCompanyId } : { company },
        select: { id: true },
      })
    const existingUserIds = existingUsers.map((u: any) => u.id)

    const existingEmployees = hasEmployeeBackup
      ? await (prisma as any).settingEmployee.findMany({
        where: { id_company: { in: existingUserIds } },
        select: { id: true },
      })
      : []
    const existingEmployeeIds = existingEmployees.map((e: any) => e.id)

    const existingCustomers = await (prisma as any).customer.findMany({
      where: { company },
      select: { id: true },
    })
    const existingCustomerIds = existingCustomers.map((c: any) => c.id)

    const existingSaleMains = await (prisma as any).saleMain.findMany({
      where: { companyall: company },
      select: { id: true },
    })
    const existingSaleMainIds = existingSaleMains.map((s: any) => s.id)

    const existingDocMains = await (prisma as any).docMain.findMany({
      where: { companyall: company },
      select: { id: true },
    })
    const existingDocMainIds = existingDocMains.map((d: any) => d.id)

    const existingOrderMains = await (prisma as any).orderMain.findMany({
      where: { company },
      select: { id: true },
    })
    const existingOrderMainIds = existingOrderMains.map((o: any) => o.id)

    const existingStockTransferWhere = {
      OR: [
        { fromUserId: { in: existingUserIds } },
        { toUserId: { in: existingUserIds } },
      ],
    }
    const existingStockTransfers = await (prisma as any).stockTransfer.findMany({
      where: existingStockTransferWhere,
      select: { id: true },
    })
    const existingStockTransferIds = existingStockTransfers.map((s: any) => s.id)

    const existingLevels = await (prisma as any).level.findMany({
      select: { id: true },
    })
    const existingLevelIds = existingLevels.map((l: any) => l.id)

    // ============ DELETE (child → parent order) ============
    // Use individual deletes instead of $transaction for large datasets to avoid timeout

    // Children of SettingEmployee
    if (existingEmployeeIds.length > 0) {
      await (prisma as any).checkinFace.deleteMany({
        where: { employeeId: { in: existingEmployeeIds } },
      })
    }

    // Children of User
    if (existingUserIds.length > 0) {
      if (hasEmployeeBackup) {
        await (prisma as any).settingEmployee.deleteMany({
          where: { id_company: { in: existingUserIds } },
        })
      }
      await (prisma as any).branchConnection.deleteMany({
        where: { fromUserId: { in: existingUserIds } },
      })
    }

    // Children of Customer
    if (existingCustomerIds.length > 0) {
      await (prisma as any).drugallergy.deleteMany({
        where: { id_cus: { in: existingCustomerIds } },
      })
    }

    // Children of SaleMain
    if (existingSaleMainIds.length > 0) {
      await (prisma as any).sale.deleteMany({
        where: { id_salemain: { in: existingSaleMainIds } },
      })
      await (prisma as any).history.deleteMany({
        where: { id_salemain: { in: existingSaleMainIds } },
      })
    }

    // Children of DocMain
    if (existingDocMainIds.length > 0) {
      await (prisma as any).docDetail.deleteMany({
        where: { id_docmain: { in: existingDocMainIds } },
      })
    }

    // Children of OrderMain
    if (existingOrderMainIds.length > 0) {
      await (prisma as any).orderDetail.deleteMany({
        where: { orderId: { in: existingOrderMainIds } },
      })
    }

    // Children of StockTransfer
    if (existingStockTransferIds.length > 0) {
      await (prisma as any).stockTransferItem.deleteMany({
        where: { transferId: { in: existingStockTransferIds } },
      })
    }

    // Children of Level
    if (existingLevelIds.length > 0) {
      await (prisma as any).mainLevel.deleteMany({
        where: { company },
      })
    }

    // Delete parent tables
    await (prisma as any).saleMain.deleteMany({ where: { companyall: company } })
    await (prisma as any).docMain.deleteMany({ where: { companyall: company } })
    await (prisma as any).orderMain.deleteMany({ where: { company } })
    if (existingUserIds.length > 0) {
      await (prisma as any).stockTransfer.deleteMany({
        where: existingStockTransferWhere,
      })
    }
    if (!restoreToLoggedCompany) {
      await (prisma as any).user.deleteMany({ where: { company } })
    }
    await (prisma as any).customer.deleteMany({ where: { company } })
    await (prisma as any).supplier.deleteMany({ where: { company } })
    await (prisma as any).getagory.deleteMany({ where: { company } })
    await (prisma as any).group.deleteMany({ where: { company } })
    await (prisma as any).fixname.deleteMany({ where: { company } })
    await (prisma as any).type.deleteMany({ where: { company } })
    await (prisma as any).unit.deleteMany({ where: { company } })
    await (prisma as any).area.deleteMany({ where: { company } })
    await (prisma as any).datalist.deleteMany({ where: { company } })
    await (prisma as any).receive.deleteMany({ where: { company } })
    await (prisma as any).rCitemlist.deleteMany({ where: { company } })
    await (prisma as any).indicator.deleteMany({ where: { company } })
    await (prisma as any).methodlist.deleteMany({ where: { company } })
    await (prisma as any).timeL.deleteMany({ where: { company } })
    await (prisma as any).useL.deleteMany({ where: { company } })
    await (prisma as any).timeUseL.deleteMany({ where: { company } })
    await (prisma as any).keepL.deleteMany({ where: { company } })
    await (prisma as any).remarkL.deleteMany({ where: { company } })
    await (prisma as any).labeldata.deleteMany({ where: { company } })
    await (prisma as any).settingStore.deleteMany({ where: { company } })
    await (prisma as any).settingLabel.deleteMany({ where: { company } })
    await (prisma as any).settingpoint.deleteMany({ where: { company } })
    await (prisma as any).settingpayment.deleteMany({ where: { company } })
    await (prisma as any).paymentProvider.deleteMany({ where: { company } })
    await (prisma as any).paymentTransaction.deleteMany({ where: { company } })
    await (prisma as any).promotion.deleteMany({ where: { company } })
    await (prisma as any).gifts.deleteMany({ where: { company } })
    await (prisma as any).interaction.deleteMany({ where: { company } })
    await (prisma as any).pL.deleteMany({ where: { company } })
    await (prisma as any).rCstockchange.deleteMany({ where: { company } })
    await (prisma as any).stockTransaction.deleteMany({ where: { company } })
    await (prisma as any).incentiveSetting.deleteMany({ where: { company } })
    await (prisma as any).unitConversion.deleteMany({ where: { company } })
    await (prisma as any).temperatureRecord.deleteMany({ where: { company } })
    await (prisma as any).temperatureSetting.deleteMany({ where: { company } })
    await (prisma as any).temperaturePoint.deleteMany({ where: { company } })
    await (prisma as any).checkin.deleteMany({ where: { idcompany: company } })
    await (prisma as any).checkinSet.deleteMany({ where: { idcompany: company } })
    await (prisma as any).checkstock.deleteMany({ where: { idcompany: company } })
    await (prisma as any).leaveConfig.deleteMany({ where: { idcompany: company } })
    await (prisma as any).leaveRecord.deleteMany({ where: { idcompany: company } })
    await (prisma as any).syncLog.deleteMany({ where: { company } })
    await (prisma as any).syncSchedule.deleteMany({ where: { company } })

    // ============ INSERT (parent → child order) ============
    // Helper: strip auto-increment id and insert, creating new ID mapping
    const idMap: Record<string, Record<number, number>> = {}

    const prepareRecord = (record: any, skipId = true) => {
      const rec = { ...record }
      if (skipId) delete rec.id
      // Convert date strings back to Date objects
      for (const key of Object.keys(rec)) {
        if (
          rec[key] &&
          typeof rec[key] === "string" &&
          /^\d{4}-\d{2}-\d{2}T/.test(rec[key])
        ) {
          rec[key] = new Date(rec[key])
        }
      }
      return rec
    }

    // Insert one-by-one — only for parent tables whose new IDs are needed in idMap
    const insertMany = async (model: string, records: any[], skipId = true) => {
      if (!records || records.length === 0) return
      idMap[model] = {}
      for (const record of records) {
        const oldId = record.id
        const rec = prepareRecord(record, skipId)
        try {
          const created = await (prisma as any)[model].create({ data: rec })
          if (oldId !== undefined) {
            idMap[model][oldId] = created.id
          }
        } catch (err: any) {
          console.error(`Error inserting ${model}:`, err.message)
        }
      }
    }

    // Bulk insert in chunks — for tables whose new IDs are never referenced later.
    // A single request restoring ~10k rows one-by-one exceeds the dev server's
    // 5-minute request timeout, so bulk paths must use createMany.
    const insertManyBulk = async (model: string, records: any[]) => {
      if (!records || records.length === 0) return
      const chunkSize = 500
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize).map((r) => prepareRecord(r))
        try {
          await (prisma as any)[model].createMany({ data: chunk })
        } catch (err: any) {
          // Fall back to row-by-row so one bad record doesn't drop the whole chunk
          console.error(`Error bulk inserting ${model}, retrying row-by-row:`, err.message)
          for (const rec of chunk) {
            try {
              await (prisma as any)[model].create({ data: rec })
            } catch (rowErr: any) {
              console.error(`Error inserting ${model}:`, rowErr.message)
            }
          }
        }
      }
    }

    // Parent tables first
    if (restoreToLoggedCompany) {
      idMap.user = {}
      const sourceCompanyId = Number(sourceCompany)
      if (Number.isInteger(sourceCompanyId)) {
        idMap.user[sourceCompanyId] = targetCompanyId
      }
      if (Array.isArray(data.User)) {
        for (const user of data.User) {
          const oldId = Number(user?.id)
          if (Number.isInteger(oldId)) {
            idMap.user[oldId] = targetCompanyId
          }
        }
      }
    } else {
      await insertMany("user", data.User)
    }

    // Remap SettingEmployee FK
    if (data.SettingEmployee) {
      for (const emp of data.SettingEmployee) {
        if (restoreToLoggedCompany) {
          emp.id_company = targetCompanyId
          if (targetUser?.company) emp.company = targetUser.company
        } else if (idMap.user && idMap.user[emp.id_company]) {
          emp.id_company = idMap.user[emp.id_company]
        }
      }
    }
    await insertMany("settingEmployee", data.SettingEmployee)

    // Remap CheckinFace FK
    if (data.CheckinFace) {
      for (const cf of data.CheckinFace) {
        if (idMap.settingEmployee && idMap.settingEmployee[cf.employeeId]) {
          cf.employeeId = idMap.settingEmployee[cf.employeeId]
        }
      }
    }
    await insertManyBulk("checkinFace", data.CheckinFace)

    // Remap BranchConnection FK
    if (data.BranchConnection) {
      for (const bc of data.BranchConnection) {
        if (restoreToLoggedCompany) {
          bc.fromUserId = (idMap.user && idMap.user[bc.fromUserId]) || targetCompanyId
          if (bc.toUserId) {
            bc.toUserId = (idMap.user && idMap.user[bc.toUserId]) || null
          }
        } else if (idMap.user && idMap.user[bc.fromUserId]) {
          bc.fromUserId = idMap.user[bc.fromUserId]
        }
        if (!restoreToLoggedCompany && bc.toUserId && idMap.user && idMap.user[bc.toUserId]) {
          bc.toUserId = idMap.user[bc.toUserId]
        }
      }
    }
    await insertManyBulk("branchConnection", data.BranchConnection)

    // Customer + Drugallergy
    await insertMany("customer", data.Customer)
    if (data.Drugallergy) {
      for (const da of data.Drugallergy) {
        if (idMap.customer && idMap.customer[da.id_cus]) {
          da.id_cus = idMap.customer[da.id_cus]
        }
      }
    }
    await insertManyBulk("drugallergy", data.Drugallergy)

    // SaleMain + Sale + History
    await insertMany("saleMain", data.SaleMain)
    if (data.Sale) {
      for (const s of data.Sale) {
        if (idMap.saleMain && idMap.saleMain[s.id_salemain]) {
          s.id_salemain = idMap.saleMain[s.id_salemain]
        }
      }
    }
    await insertManyBulk("sale", data.Sale)
    if (data.History) {
      for (const h of data.History) {
        if (idMap.saleMain && idMap.saleMain[h.id_salemain]) {
          h.id_salemain = idMap.saleMain[h.id_salemain]
        }
      }
    }
    await insertManyBulk("history", data.History)

    // DocMain + DocDetail
    await insertMany("docMain", data.DocMain)
    if (data.DocDetail) {
      for (const dd of data.DocDetail) {
        if (idMap.docMain && idMap.docMain[dd.id_docmain]) {
          dd.id_docmain = idMap.docMain[dd.id_docmain]
        }
      }
    }
    await insertManyBulk("docDetail", data.DocDetail)

    // Level + MainLevel
    await insertMany("level", data.Level)
    if (data.MainLevel) {
      for (const ml of data.MainLevel) {
        if (idMap.level && idMap.level[ml.levelId]) {
          ml.levelId = idMap.level[ml.levelId]
        }
      }
    }
    await insertManyBulk("mainLevel", data.MainLevel)

    // OrderMain + OrderDetail
    await insertMany("orderMain", data.OrderMain)
    if (data.OrderDetail) {
      for (const od of data.OrderDetail) {
        if (idMap.orderMain && idMap.orderMain[od.orderId]) {
          od.orderId = idMap.orderMain[od.orderId]
        }
      }
    }
    await insertManyBulk("orderDetail", data.OrderDetail)

    // StockTransfer + StockTransferItem
    if (data.StockTransfer) {
      for (const st of data.StockTransfer) {
        if (restoreToLoggedCompany) {
          st.fromUserId = (idMap.user && idMap.user[st.fromUserId]) || st.fromUserId || targetCompanyId
          st.toUserId = (idMap.user && idMap.user[st.toUserId]) || st.toUserId || targetCompanyId
        } else if (idMap.user && idMap.user[st.fromUserId]) {
          st.fromUserId = idMap.user[st.fromUserId]
        }
        if (!restoreToLoggedCompany && idMap.user && idMap.user[st.toUserId]) {
          st.toUserId = idMap.user[st.toUserId]
        }
      }
    }
    await insertMany("stockTransfer", data.StockTransfer)
    if (data.StockTransferItem) {
      for (const sti of data.StockTransferItem) {
        if (idMap.stockTransfer && idMap.stockTransfer[sti.transferId]) {
          sti.transferId = idMap.stockTransfer[sti.transferId]
        }
      }
    }
    await insertManyBulk("stockTransferItem", data.StockTransferItem)

    // Independent tables (no FK remapping needed)
    await insertManyBulk("getagory", data.Getagory)
    await insertManyBulk("group", data.Group)
    await insertManyBulk("fixname", data.Fixname)
    await insertManyBulk("type", data.Type)
    await insertManyBulk("unit", data.Unit)
    await insertManyBulk("area", data.Area)
    await insertManyBulk("datalist", data.Datalist)
    await insertManyBulk("supplier", data.Supplier)
    await insertManyBulk("receive", data.Receive)
    await insertManyBulk("rCitemlist", data.RCitemlist)
    await insertManyBulk("indicator", data.Indicator)
    await insertManyBulk("methodlist", data.Methodlist)
    await insertManyBulk("timeL", data.TimeL)
    await insertManyBulk("useL", data.UseL)
    await insertManyBulk("timeUseL", data.TimeUseL)
    await insertManyBulk("keepL", data.KeepL)
    await insertManyBulk("remarkL", data.RemarkL)
    await insertManyBulk("labeldata", data.Labeldata)
    await insertManyBulk("settingStore", data.SettingStore)
    await insertManyBulk("settingLabel", data.SettingLabel)
    await insertManyBulk("settingpoint", data.Settingpoint)
    await insertManyBulk("settingpayment", data.Settingpayment)
    await insertManyBulk("paymentProvider", data.PaymentProvider)
    await insertManyBulk("paymentTransaction", data.PaymentTransaction)
    await insertManyBulk("promotion", data.Promotion)
    await insertManyBulk("label_language", data.Label_language)
    await insertManyBulk("gifts", data.Gifts)
    await insertManyBulk("interaction", data.Interaction)
    await insertManyBulk("pL", data.PL)
    await insertManyBulk("rCstockchange", data.RCstockchange)
    await insertManyBulk("stockTransaction", data.StockTransaction)
    await insertManyBulk("incentiveSetting", data.IncentiveSetting)
    await insertManyBulk("unitConversion", data.UnitConversion)
    await insertManyBulk("temperatureRecord", data.TemperatureRecord)
    await insertManyBulk("temperatureSetting", data.TemperatureSetting)
    await insertManyBulk("temperaturePoint", data.TemperaturePoint)
    await insertManyBulk("checkin", data.Checkin)
    await insertManyBulk("checkinSet", data.CheckinSet)
    await insertManyBulk("checkstock", data.Checkstock)
    await insertManyBulk("leaveConfig", data.LeaveConfig)
    await insertManyBulk("leaveRecord", data.LeaveRecord)
    await insertManyBulk("syncLog", data.SyncLog)
    await insertManyBulk("syncSchedule", data.SyncSchedule)

    return NextResponse.json({
      success: true,
      message: "Restore completed successfully",
      sourceCompany,
      company,
    })
  } catch (error: any) {
    console.error("backup restore error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
