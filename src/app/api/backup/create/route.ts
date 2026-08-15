import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, startDate, endDate, selectedTables, saveOnServer, kind } = body
    // "auto" = rolling scheduled backup, "dailyclose" = snapshot taken when the
    // daily bill is locked. Each kind has its own file prefix and retention.
    const backupKind: "auto" | "dailyclose" = kind === "dailyclose" ? "dailyclose" : "auto"
    const tableFilter: string[] | null = Array.isArray(selectedTables) && selectedTables.length > 0 ? selectedTables : null

    if (!company) {
      return NextResponse.json({ error: "company is required" }, { status: 400 })
    }

    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate)
      dateFilter.lte = new Date(endDate)
    }
    const hasDateRange = startDate && endDate

    // Helper: build where clause with optional date filter
    const whereCompany = (dateField?: string) => {
      const w: any = { company }
      if (hasDateRange && dateField) {
        w[dateField] = dateFilter
      }
      return w
    }

    const whereIdCompany = (dateField?: string) => {
      const w: any = { idcompany: company }
      if (hasDateRange && dateField) {
        w[dateField] = dateFilter
      }
      return w
    }

    // ============ Fetch all tables ============
    const inc = (name: string) => !tableFilter || tableFilter.includes(name)
    const companyUserId = Number(company)
    const userWhere = Number.isInteger(companyUserId) && companyUserId > 0
      ? { id: companyUserId }
      : { company }

    // Parent tables (no FK dependencies)
    const users = inc("User") ? await (prisma as any).user.findMany({ where: userWhere }) : []
    const needsUserIds = ["SettingEmployee", "CheckinFace", "BranchConnection", "StockTransfer", "StockTransferItem"].some(inc)
    const relatedUsers = users.length > 0 || !needsUserIds
      ? users
      : await (prisma as any).user.findMany({ where: userWhere, select: { id: true } })
    const relatedUserIds = relatedUsers.map((u: any) => u.id)
    const getagories = inc("Getagory") ? await (prisma as any).getagory.findMany({ where: whereCompany() }) : []
    const groups = inc("Group") ? await (prisma as any).group.findMany({ where: whereCompany() }) : []
    const fixnames = inc("Fixname") ? await (prisma as any).fixname.findMany({ where: whereCompany() }) : []
    const types = inc("Type") ? await (prisma as any).type.findMany({ where: whereCompany() }) : []
    const units = inc("Unit") ? await (prisma as any).unit.findMany({ where: whereCompany() }) : []
    const areas = inc("Area") ? await (prisma as any).area.findMany({ where: whereCompany() }) : []
    const datalists = inc("Datalist") ? await (prisma as any).datalist.findMany({ where: whereCompany() }) : []
    const customers = inc("Customer") ? await (prisma as any).customer.findMany({ where: whereCompany() }) : []
    const suppliers = inc("Supplier") ? await (prisma as any).supplier.findMany({ where: whereCompany() }) : []
    const receives = inc("Receive") ? await (prisma as any).receive.findMany({ where: whereCompany(hasDateRange ? "receive_date" : undefined) }) : []
    const rcItemlists = inc("RCitemlist") ? await (prisma as any).rCitemlist.findMany({ where: whereCompany(hasDateRange ? "createDate" : undefined) }) : []
    const indicators = inc("Indicator") ? await (prisma as any).indicator.findMany({ where: whereCompany() }) : []
    const methodlists = inc("Methodlist") ? await (prisma as any).methodlist.findMany({ where: whereCompany() }) : []
    const timeLs = inc("TimeL") ? await (prisma as any).timeL.findMany({ where: whereCompany() }) : []
    const useLs = inc("UseL") ? await (prisma as any).useL.findMany({ where: whereCompany() }) : []
    const timeUseLs = inc("TimeUseL") ? await (prisma as any).timeUseL.findMany({ where: whereCompany() }) : []
    const keepLs = inc("KeepL") ? await (prisma as any).keepL.findMany({ where: whereCompany() }) : []
    const remarkLs = inc("RemarkL") ? await (prisma as any).remarkL.findMany({ where: whereCompany() }) : []
    const labeldatas = inc("Labeldata") ? await (prisma as any).labeldata.findMany({ where: whereCompany() }) : []
    const settingStores = inc("SettingStore") ? await (prisma as any).settingStore.findMany({ where: whereCompany() }) : []
    const settingLabels = inc("SettingLabel") ? await (prisma as any).settingLabel.findMany({ where: whereCompany() }) : []
    const settingpoints = inc("Settingpoint") ? await (prisma as any).settingpoint.findMany({ where: whereCompany() }) : []
    const settingpayments = inc("Settingpayment") ? await (prisma as any).settingpayment.findMany({ where: whereCompany() }) : []
    const paymentProviders = inc("PaymentProvider") ? await (prisma as any).paymentProvider.findMany({ where: whereCompany() }) : []
    const paymentTransactions = inc("PaymentTransaction") ? await (prisma as any).paymentTransaction.findMany({ where: whereCompany(hasDateRange ? "createdAt" : undefined) }) : []
    const promotions = inc("Promotion") ? await (prisma as any).promotion.findMany({ where: whereCompany() }) : []
    const labelLanguages = inc("Label_language") ? await (prisma as any).label_language.findMany() : []
    const gifts = inc("Gifts") ? await (prisma as any).gifts.findMany({ where: whereCompany(hasDateRange ? "createDate" : undefined) }) : []
    const interactions = inc("Interaction") ? await (prisma as any).interaction.findMany({ where: whereCompany() }) : []
    const pls = inc("PL") ? await (prisma as any).pL.findMany({ where: whereCompany() }) : []
    const rcStockchanges = inc("RCstockchange") ? await (prisma as any).rCstockchange.findMany({ where: whereCompany(hasDateRange ? "createDate" : undefined) }) : []
    const stockTransactions = inc("StockTransaction") ? await (prisma as any).stockTransaction.findMany({ where: whereCompany(hasDateRange ? "createDate" : undefined) }) : []
    const incentiveSettings = inc("IncentiveSetting") ? await (prisma as any).incentiveSetting.findMany({ where: whereCompany() }) : []
    const unitConversions = inc("UnitConversion") ? await (prisma as any).unitConversion.findMany({ where: whereCompany() }) : []
    const temperatureRecords = inc("TemperatureRecord") ? await (prisma as any).temperatureRecord.findMany({ where: whereCompany(hasDateRange ? "createdAt" : undefined) }) : []
    const temperatureSettings = inc("TemperatureSetting") ? await (prisma as any).temperatureSetting.findMany({ where: whereCompany() }) : []
    const temperaturePoints = inc("TemperaturePoint") ? await (prisma as any).temperaturePoint.findMany({ where: whereCompany() }) : []
    const checkins = inc("Checkin") ? await (prisma as any).checkin.findMany({ where: whereIdCompany(hasDateRange ? "checkin" : undefined) }) : []
    const checkinSets = inc("CheckinSet") ? await (prisma as any).checkinSet.findMany({ where: whereIdCompany() }) : []
    const checkstocks = inc("Checkstock") ? await (prisma as any).checkstock.findMany({ where: whereIdCompany(hasDateRange ? "date" : undefined) }) : []
    const leaveConfigs = inc("LeaveConfig") ? await (prisma as any).leaveConfig.findMany({ where: whereIdCompany() }) : []
    const leaveRecords = inc("LeaveRecord") ? await (prisma as any).leaveRecord.findMany({ where: whereIdCompany(hasDateRange ? "leaveDate" : undefined) }) : []
    const syncLogs = inc("SyncLog") ? await (prisma as any).syncLog.findMany({ where: whereCompany(hasDateRange ? "createdAt" : undefined) }) : []
    const syncSchedules = inc("SyncSchedule") ? await (prisma as any).syncSchedule.findMany({ where: whereCompany() }) : []

    // Child tables with FK to User
    const settingEmployees = inc("SettingEmployee") ? await (prisma as any).settingEmployee.findMany({
      where: { id_company: { in: relatedUserIds } }
    }) : []
    const settingEmployeesForRelations = settingEmployees.length > 0 || inc("SettingEmployee") || !inc("CheckinFace")
      ? settingEmployees
      : await (prisma as any).settingEmployee.findMany({
        where: { id_company: { in: relatedUserIds } },
        select: { id: true },
      })
    const settingEmployeeIds = settingEmployeesForRelations.map((e: any) => e.id)
    const checkinFaces = inc("CheckinFace") ? await (prisma as any).checkinFace.findMany({
      where: { employeeId: { in: settingEmployeeIds } }
    }) : []
    const branchConnections = inc("BranchConnection") ? await (prisma as any).branchConnection.findMany({
      where: {
        OR: [
          { fromUserId: { in: relatedUserIds } },
          { toUserId: { in: relatedUserIds } },
        ],
      }
    }) : []

    // Child tables with FK to Customer
    const drugallergys = inc("Drugallergy") ? await (prisma as any).drugallergy.findMany({
      where: { id_cus: { in: customers.map((c: any) => c.id) } }
    }) : []

    // SaleMain and children
    const saleMains = inc("SaleMain") ? await (prisma as any).saleMain.findMany({
      where: {
        companyall: company,
        ...(hasDateRange ? { createDate: dateFilter } : {})
      }
    }) : []
    const saleMainIds = saleMains.map((s: any) => s.id)
    const sales = inc("Sale") ? await (prisma as any).sale.findMany({
      where: { id_salemain: { in: saleMainIds } }
    }) : []
    const histories = inc("History") ? await (prisma as any).history.findMany({
      where: { id_salemain: { in: saleMainIds } }
    }) : []

    // DocMain and children
    const docMains = inc("DocMain") ? await (prisma as any).docMain.findMany({
      where: {
        companyall: company,
        ...(hasDateRange ? { createDate: dateFilter } : {})
      }
    }) : []
    const docMainIds = docMains.map((d: any) => d.id)
    const docDetails = inc("DocDetail") ? await (prisma as any).docDetail.findMany({
      where: { id_docmain: { in: docMainIds } }
    }) : []

    // Level and MainLevel
    const levels = inc("Level") ? await (prisma as any).level.findMany() : []
    const mainLevels = inc("MainLevel") ? await (prisma as any).mainLevel.findMany({ where: whereCompany() }) : []

    // OrderMain and children
    const orderMains = inc("OrderMain") ? await (prisma as any).orderMain.findMany({
      where: {
        company,
        ...(hasDateRange ? { createDate: dateFilter } : {})
      }
    }) : []
    const orderMainIds = orderMains.map((o: any) => o.id)
    const orderDetails = inc("OrderDetail") ? await (prisma as any).orderDetail.findMany({
      where: { orderId: { in: orderMainIds } }
    }) : []

    // StockTransfer and children
    const stockTransferWhere: any = {
      OR: [
        { fromUserId: { in: relatedUserIds } },
        { toUserId: { in: relatedUserIds } },
      ],
      ...(hasDateRange ? { createdAt: dateFilter } : {})
    }
    const stockTransfers = inc("StockTransfer") ? await (prisma as any).stockTransfer.findMany({
      where: stockTransferWhere
    }) : []
    const stockTransfersForRelations = stockTransfers.length > 0 || inc("StockTransfer") || !inc("StockTransferItem")
      ? stockTransfers
      : await (prisma as any).stockTransfer.findMany({
        where: stockTransferWhere,
        select: { id: true },
      })
    const stockTransferIds = stockTransfersForRelations.map((s: any) => s.id)
    const stockTransferItems = inc("StockTransferItem") ? await (prisma as any).stockTransferItem.findMany({
      where: { transferId: { in: stockTransferIds } }
    }) : []

    // Build data object — only include tables that have data or were requested
    const data: any = {
      User: users,
      SettingEmployee: settingEmployees,
      CheckinFace: checkinFaces,
      BranchConnection: branchConnections,
      Getagory: getagories,
      Group: groups,
      Fixname: fixnames,
      Type: types,
      Unit: units,
      Area: areas,
      Datalist: datalists,
      Customer: customers,
      Drugallergy: drugallergys,
      Supplier: suppliers,
      Receive: receives,
      RCitemlist: rcItemlists,
      SaleMain: saleMains,
      Sale: sales,
      History: histories,
      Gifts: gifts,
      Indicator: indicators,
      Methodlist: methodlists,
      TimeL: timeLs,
      UseL: useLs,
      TimeUseL: timeUseLs,
      KeepL: keepLs,
      RemarkL: remarkLs,
      Labeldata: labeldatas,
      SettingStore: settingStores,
      SettingLabel: settingLabels,
      Settingpoint: settingpoints,
      Settingpayment: settingpayments,
      PaymentProvider: paymentProviders,
      PaymentTransaction: paymentTransactions,
      Promotion: promotions,
      Label_language: labelLanguages,
      DocMain: docMains,
      DocDetail: docDetails,
      PL: pls,
      Interaction: interactions,
      Level: levels,
      MainLevel: mainLevels,
      Checkin: checkins,
      CheckinSet: checkinSets,
      Checkstock: checkstocks,
      RCstockchange: rcStockchanges,
      StockTransaction: stockTransactions,
      OrderMain: orderMains,
      OrderDetail: orderDetails,
      IncentiveSetting: incentiveSettings,
      StockTransfer: stockTransfers,
      StockTransferItem: stockTransferItems,
      UnitConversion: unitConversions,
      TemperatureRecord: temperatureRecords,
      TemperatureSetting: temperatureSettings,
      TemperaturePoint: temperaturePoints,
      LeaveConfig: leaveConfigs,
      LeaveRecord: leaveRecords,
      SyncLog: syncLogs,
      SyncSchedule: syncSchedules,
    }

    const recordCounts: any = {}
    for (const [key, value] of Object.entries(data)) {
      recordCounts[key] = (value as any[]).length
    }

    const backupData = {
      metadata: {
        createdAt: new Date().toISOString(),
        company,
        startDate: startDate || null,
        endDate: endDate || null,
        type: hasDateRange ? "partial" : "full",
        kind: saveOnServer ? backupKind : undefined,
        recordCounts,
      },
      data,
    }

    // Server-side save for auto-backup
    if (saveOnServer) {
      try {
        const backupDir = path.join(process.cwd(), "uploads", "backups")
        await fs.mkdir(backupDir, { recursive: true })
        const now = new Date()
        const prefix = backupKind === "dailyclose" ? "dailyclose_backup_" : "auto_backup_"
        // Daily-close snapshots are audit checkpoints — keep them for 90 days,
        // while the rolling scheduled backups stay on a 48-hour window.
        const retentionHours = backupKind === "dailyclose" ? 90 * 24 : 48
        const fname = `${prefix}${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.json`
        await fs.writeFile(path.join(backupDir, fname), JSON.stringify(backupData, null, 2), "utf-8")

        // Cleanup: delete backup files of this kind past their retention window
        const cutoff = Date.now() - retentionHours * 60 * 60 * 1000
        const files = (await fs.readdir(backupDir)).filter(f => f.startsWith(prefix) && f.endsWith(".json"))
        for (const f of files) {
          try {
            const stat = await fs.stat(path.join(backupDir, f))
            if (stat.mtimeMs < cutoff) {
              await fs.unlink(path.join(backupDir, f)).catch(() => {})
            }
          } catch {}
        }

        return NextResponse.json({ ...backupData, savedFile: fname })
      } catch (saveErr: any) {
        console.error("Server-side backup save failed:", saveErr)
        return NextResponse.json({ ...backupData, savedFile: null, saveError: saveErr.message })
      }
    }

    return NextResponse.json(backupData)
  } catch (error: any) {
    console.error("backup create error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
