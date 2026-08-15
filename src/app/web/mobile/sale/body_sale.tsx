"use client";
import styles from "../../componant/mystyle.module.css";
import React, {
  useEffect,
  useState,
  ChangeEvent,
  KeyboardEvent,
  use,
  useRef,
  useMemo,
} from "react";

import Image from "next/image";
import axios from "axios";
import {
  getPrinters as getPlatformPrinters,
  isSilentPrintAvailable,
  printSilent,
} from "@/lib/runtime/print";
import { Table } from "react-bootstrap";
import Toast from "react-bootstrap/Toast";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
const widths = 70;
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  RadioGroup,
  Radio,
} from "@heroui/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ifError } from "assert";
import { ta } from "date-fns/locale";
import Modal1 from "react-bootstrap/Modal";
import Button1 from "react-bootstrap/Button";
import Modal_rw from "react-bootstrap/Modal";
import Button_rw from "react-bootstrap/Button";
import Modal_dc from "react-bootstrap/Modal";
import Button_dc from "react-bootstrap/Button";
import Modal_rc from "react-bootstrap/Modal";
import Button_rc from "react-bootstrap/Button";
import Modal_fill from "react-bootstrap/Modal";
import Button_full from "react-bootstrap/Button";
import Modal_qa from "react-bootstrap/Modal";
import QRCode from "react-qr-code";

import SpinnerIcon from "../../componant/spinnerIcon";
import LoadingOverlay from "../../componant/LoadingOverlay";
import { fetchBarcodeAliases, buildBarcodeIndex, normalizeBarcode, type AliasIndexRow } from "@/lib/barcodeAliasClient";
import { lotUnitCost } from "@/lib/lotCost";

import DatePicker from "react-datepicker";
import { Toaster, toast } from "sonner";
import "react-datepicker/dist/react-datepicker.css";

// Tittle
const getsalehistory = "salehistory";

const apis = "receive";
const apidatalist = "datalist";
const apidataitemlist = "dataitemlist";
const apicustomer = "customer";
const apibalance = "sale_cal/sale_balance";

// Label
const apiindicatorlist = "label/indicatorlist";
const apitimes = "label/times";
const apitimeL = "label/timeL";
const apiuseL = "label/useL";
const apitimeuseL = "label/timeuseL";
const apikeepL = "label/keepL";
const apiRemarkL = "label/remarkL";

// Setting
const getemployee = "setting/employee";
const getpoint = "setting/point";
const getlabel = "setting/label";
const getstore = "setting/store/store";
const getpayment = "setting/payment";

const apipromotion = "promotion";

const apilabeldata = "label/labeldata";
const apilabeldata_all = "label/labeldata_all";

const apiquatation = "quatation";

const getdrugg = "drugallergy";

const getInteraction = "interaction";

const apigiftlist = "gift/giftlist";

import deletes from "../../../icon/cancel.jpg";
import LabelPage from "../../dataproduct/label/page";
import { useReactToPrint } from "react-to-print";
import ReactDOMServer from "react-dom/server";
import { getThermalReceiptHorizontalOffset } from "@/utils/receiptPrintStyles";

import { useMessageStore } from "./useMessageStore";
import SellerCommunicationModal from "./SellerCommunicationModal";

/*********************************************** */
function BodyTabSale(idDatalist: any) {
  //  const idsale=useMessageStore((state) => state.idsale)
  const idF = Number(idDatalist.data1);
  //console.log(idF)

  //ส่งค่ากลับ
  const setMessage = useMessageStore((state) => state.setMessage);
  const setsavehis = useMessageStore((state) => state.setsavehis);
  const savehis = useMessageStore((state) => state.savehis);

  //รับค่า
  const savemu = useMessageStore((state) => state.savemu);
  const scannedBarcode = useMessageStore((state) => state.scannedBarcode);

  // Focus Refs for Sales Process
  const receiveInputRef = useRef<HTMLInputElement>(null);
  const confirmPaymentRef = useRef<HTMLButtonElement>(null);

  const [dataProduct, setdataProduct] = useState<any[]>([]);
  const [barcodeAliases, setBarcodeAliases] = useState<AliasIndexRow[]>([]);
  const [dataRCFull, setdataItemRCFull] = useState([]);
  const [dateitemRC, setdateitemRC] = useState([]);

  const initialValues7 = {
    id: "",
    company: "",
    code: "",
    indicatorlistS: "",
    timeS: "",
    useS: "",
    timeuseS: "",
    keepS: "",
    remarkS: "",
  };

  const [alllabel, setlabel] = useState([]);
  const [alllabelitem, setlabelitem] = useState(initialValues7);
  /**Todat List */
  const [list, setList] = useState<Task[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("listS");
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to parse listS from localStorage", e);
        return [];
      }
    }
    return [];
  });

  const [list_rc, setList_rc] = useState<Task_rc[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("list_rcS");
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to parse list_rcS from localStorage", e);
        return [];
      }
    }
    return [];
  });

  // Translation
  const [indi, setindi] = useState([]);
  const [timeL, settimeL] = useState([]);
  const [useL, setuseL] = useState([]);
  const [timeuseL, settimeuseL] = useState([]);
  const [keepL, setkeepL] = useState([]);
  const [RemarkL, setRemarkL] = useState([]);

  // Setting Employee
  const [postsEmp, setPostsEmp] = useState([]);

  // Setting Interaction
  const [interaction, setInertaction] = useState([]);

  // Setting Label
  /***************************************************** */
  const [idS, SetId] = useState("");
  const [compa, Setcompany] = useState("");
  const [storeS, SetStore] = useState("");
  const [addressS, SetAddress] = useState("");
  const [telS, SetTel] = useState("");
  const [taxS, SetTax] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedUrl1, setUploadedUrl1] = useState<string | null>(null);
  const [allS, Setall] = useState(false);
  const [logoS, Setlogo] = useState(true);
  const [lineS, Setline] = useState(true);

  // Setting Reward
  const [SaleS, SetSaleInput] = useState("");
  const [pointeqS, SetPoint] = useState("");
  const [pointsetS, SetPointSet] = useState("");
  const [discountS, SetDiscount] = useState("");
  const [statusS, SetStatus] = useState("");

  // ค่าหยิบ
  const [giftlist, setgiftlist] = useState([]);

  // Product Balance from stock-balance-summary API (keyed by product id เพื่อรองรับกรณีรหัสซ้ำ)
  const [productBalances, setProductBalances] = useState<Map<number, number>>(
    new Map(),
  );

  const normalizeStockBalance = (value: unknown) => {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const getSummaryBalanceValue = (summary: any) => normalizeStockBalance(summary?.calculatedBalance ?? summary?.totalBalance ?? 0);

  const formatStockBalance = (value: number) => normalizeStockBalance(value).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Fetch balance only for the selected product (สูตรเดียวกับหน้าสรุปยอดคงเหลือ)
  useEffect(() => {
    const fetchBalance = async () => {
      if (typeof window === "undefined" || !idF) return;
      const companyS = localStorage.getItem("company_") || "";
      const product = dataProduct.find((p: any) => p.id === idF);
      const code = product?.code;
      if (!code) return;

      try {
        const response = await axios.get(
          `/api/stock-balance-summary?itemcode=${encodeURIComponent(code)}&company=${encodeURIComponent(companyS)}&id=${idF}`,
        );
        const summaryBalance = getSummaryBalanceValue(response.data);
        setProductBalances((prev) => {
          const newMap = new Map(prev);
          newMap.set(Number(idF), summaryBalance);
          return newMap;
        });
      } catch (error) {
        console.error(`Error fetching balance for ${code}:`, error);
      }
    };

    fetchBalance();
  }, [idF, dataProduct]);

  // Fetch balances for cart items so compact mobile cards match the stock summary page.
  useEffect(() => {
    const fetchCartBalances = async () => {
      if (typeof window === "undefined" || list.length === 0) return;
      const companyS = localStorage.getItem("company_") || "";
      const productIds = [...new Set(list.map((item: any) => Number(item.id_product)).filter(Boolean))];
      const idsToFetch = productIds.filter((productId) => !productBalances.has(productId));
      if (idsToFetch.length === 0) return;

      const newMap = new Map(productBalances);
      for (const productId of idsToFetch) {
        const product = dataProduct.find((productItem: any) => Number(productItem.id) === Number(productId));
        const code = product?.code;
        if (!code) continue;

        try {
          const response = await axios.get(
            `/api/stock-balance-summary?itemcode=${encodeURIComponent(code)}&company=${encodeURIComponent(companyS)}&id=${productId}`,
          );
          newMap.set(Number(productId), getSummaryBalanceValue(response.data));
        } catch (error) {
          console.error(`Error fetching balance for id=${productId}:`, error);
        }
      }

      setProductBalances(newMap);
    };

    fetchCartBalances();
  }, [list, dataProduct]);

  const [companyS, setcom] = useState("");
  const [paystore, Setpaystore] = useState("");

  // Pharmacist Setting
  const modalPS = useDisclosure();
  const [selectedPS, setSelectedPS] = useState("");

  useEffect(() => {
    setSelectedPS(localStorage.getItem("ps") || "");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("countrow", "หน้าร้าน");
    }

    let companyS = "";
    if (typeof window !== "undefined") {
      setcom(localStorage.getItem("company_") || "");
    }

    setTimeout(() => {
      Setpaystore(localStorage.getItem("countrow") || "");
    }, 500);
  }, []);
  const [promotionfullS, SetPromotionfull] = useState<PromotionS[]>([]);

  interface PromotionS {
    id: number;
    name_promotion: string;
    customer: string;
    conditionid: number;
    condition: string;
    startdate: string;
    enddate: string;
    unit: string;
    pay_condition: number;
    discount: number;
    status: string;
    msg_condition: string;
    msg_discount: string;
    cal: number;
  }
  // console.log([...promotionfullS])
  //*************************** */
  useEffect(() => {
    const fetchPosts = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const [res, aliases] = await Promise.all([
          axios.get(`/api/${apidatalist}?company=${companyS}`),
          // บาร์โค้ดสำรอง — payload เล็กมาก และมี cache ในตัว
          fetchBarcodeAliases(companyS),
        ]);
        setdataProduct(res.data);
        setBarcodeAliases(aliases);
        // console.log(res.data)
      } catch (error) {
        console.error(error);
      }
    };
    fetchPosts();

    const fetchItemRC = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(
          `/api/${apidataitemlist}?company=${String(companyS)}`,
        );
        setdataItemRCFull(res.data);
        // console.log(res.data)
      } catch (error) {
        console.error(error);
      }
    };
    fetchItemRC();

    //Get Label Data
    const LabelData = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(
          `/api/${apilabeldata_all}?company=${companyS} `,
        );
        setlabel(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    LabelData();

    //Get Label Data    Translator
    const LabelLangage = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const indicator = await axios.get(
          `/api/${apiindicatorlist}?company=${companyS}`,
        );
        const timeL = await axios.get(`/api/${apitimeL}?company=${companyS}`);
        const useL = await axios.get(`/api/${apiuseL}?company=${companyS}`);
        const timeuseL = await axios.get(
          `/api/${apitimeuseL}?company=${companyS}`,
        );
        const keepL = await axios.get(`/api/${apikeepL}?company=${companyS}`);
        const RemarkL = await axios.get(
          `/api/${apiRemarkL}?company=${companyS}`,
        );

        setindi(indicator.data);
        settimeL(timeL.data);
        setuseL(useL.data);
        settimeuseL(timeuseL.data);
        setkeepL(keepL.data);
        setRemarkL(RemarkL.data);
        //  console.log(useL.data)
      } catch (error) {
        console.error(error);
      }
    };
    LabelLangage();

    // Get Setting Employee
    const GetEmployee = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(
          `/api/${getemployee}?id_company=${companyS}&position=pharmacist`,
        ); //Get_Employee
        setPostsEmp(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    GetEmployee();

    // Get GetInertaction
    const GetInertaction = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(
          `/api/${getInteraction}?company=${companyS}`,
        ); //Get_Employee
        setInertaction(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    GetInertaction();

    //******************Get Stting************************************ */
    const fetchPostStore = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        //ร้านค้า
        const res = await axios.get(`/api/${getstore}?company=${companyS}`); //Get_Employee
        res.data[0] == undefined ? "" : SetId(res.data[0].id);
        res.data[0] == undefined ? "" : Setcompany(res.data[0].company);
        res.data[0] == undefined ? "" : SetStore(res.data[0].namestore);
        res.data[0] == undefined ? "" : SetAddress(res.data[0].address);
        res.data[0] == undefined ? "" : SetTel(res.data[0].tel);
        res.data[0] == undefined ? "" : SetTax(res.data[0].taxnumber);
        res.data[0] == undefined ? "" : setUploadedUrl(res.data[0].publiclogo);
        res.data[0] == undefined ? "" : setUploadedUrl1(res.data[0].publicline);
        //ฉลากยา
        const res1 = await axios.get(`/api/${getlabel}?company=${companyS}`);
        res1.data[0] == undefined
          ? ""
          : Setall(res1.data[0].all === "true" ? true : false);
        res1.data[0] == undefined
          ? ""
          : Setlogo(res1.data[0].logo === "true" ? true : false);
        res1.data[0] == undefined
          ? ""
          : Setline(res1.data[0].line === "true" ? true : false);
        //แต้มสะสม
        const res2 = await axios.get(`/api/${getpoint}?company=${companyS}`);
        res2.data[0] == undefined ? "" : SetSaleInput(res2.data[0].sale);
        res2.data[0] == undefined ? "" : SetPoint(res2.data[0].pointeq);
        res2.data[0] == undefined ? "" : SetPointSet(res2.data[0].pointset);
        res2.data[0] == undefined ? "" : SetDiscount(res2.data[0].discount);
        res2.data[0] == undefined ? "" : SetStatus(res2.data[0].status);

        const res3 = await axios.get(
          `/api/${apipromotion}?company=${companyS}`,
        );
        (await res3.data[0]) == undefined ? "" : SetPromotionfull(res3.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPostStore();

    /** ค่าหยิบ************************************** */
    const fetchGet_Giftlist = async () => {
      if (typeof window === "undefined") return; // check client
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(`/api/${apigiftlist}?company=${companyS}`);

        setgiftlist(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchGet_Giftlist();

    localStorage.setItem(
      "his",
      JSON.stringify([
        {
          followup: String(""),
          solution: String(""),
          id_history: "",
          count: String(""),
          statusH: "",
          duedate: new Date(),
          person: String(localStorage.getItem("person_") || ""),
        },
      ]),
    );

    localStorage.setItem("dg", JSON.stringify([]));
  }, []);

  //*****Printer****************** */
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter_label, setSelectedPrinter_label] =
    useState<string>("");
  const [selectedPrinter_rc, setSelectedPrinter_rc] = useState<string>("");
  const [selectedPrinter_a4, setSelectedPrinter_a4] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedPrinter = localStorage.getItem("auto_printer_label");
    if (savedPrinter) {
      setSelectedPrinter_label(savedPrinter);
    }

    const savedPrinter_rc = localStorage.getItem("auto_printer_rc");
    if (savedPrinter_rc) {
      setSelectedPrinter_rc(savedPrinter_rc);
    }

    const savedPrinter_a4 = localStorage.getItem("auto_printer_a4");
    if (savedPrinter_a4) {
      setSelectedPrinter_a4(savedPrinter_a4);
    }

    getPlatformPrinters().then((printerList) => {
      setPrinters(printerList as any[]);
    });
  }, []);

  //************************************************************** */

  //  const [dateRC, setdateRC] = useState([])
  // Function to delete item from list using id to delete
  const deleteItem = (id: any) => {
    const updatedList = list.filter((item) => item.id !== id);
    setList(updatedList);
  };
  const deleteall = () => {
    setList([]);
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("listS", JSON.stringify(list));
    localStorage.setItem("list_rcS", JSON.stringify(list_rc));
  }

  const [priceAct, setEditedpriceAct] = useState<string>("");
  const [priceDis, setEditedpriceDis] = useState<string>("");
  const [editedTaskText, setEditedTaskText] = useState<string>("");
  const [editedTaskText1, setEditedTaskText1] = useState<string>("");
  const [editedcode, setEditedcode] = useState<string>("");
  const [editedTaskname, setEditedname] = useState<string>("");
  const [costS, setcostS] = useState("");

  const [receivebaht, setreceivebaht] = useState<string>("");
  const [netbaht, setnetbaht] = useState<string>("");

  interface Task {
    id: number;
    company: string;
    id_product: number;
    code_product: string;
    name_product: string;
    fixname: string;
    cetagory: string;
    unit: string;
    barcode: string;
    qty: number;
    cost: Number;
    costtotal: Number;
    price: number;
    discount: number;
    gift: number;
    totalgift: number;
    diff: number;
    total: number;
    id_receive1: number;
    lot_receive1: string;
    qty_lot1: number;
    std_qty_lot1: number;
    sale_qty_lot1: number;
    id_receive2: number;
    lot_receive2: string;
    qty_lot2: number;
    std_qty_lot2: number;
    sale_qty_lot2: number;
    id_receive3: number;
    lot_receive3: string;
    qty_lot3: number;
    std_qty_lot3: number;
    sale_qty_lot3: number;
    person: string;
    statuss: string;
    label: boolean;
    indicatorlistS: string;
    timeS: string;
    useS: string;
    timeuseS: string;
    keepS: string;
    remarkS: string;
    my_indicatorlistS: string;
    my_timeS: string;
    my_useS: string;
    my_timeuseS: string;
    my_keepS: string;
    my_remarkS: string;
    lo_indicatorlistS: string;
    lo_timeS: string;
    lo_useS: string;
    lo_timeuseS: string;
    lo_keepS: string;
    lo_remarkS: string;
    en_indicatorlistS: string;
    en_timeS: string;
    en_useS: string;
    en_timeuseS: string;
    en_keepS: string;
    en_remarkS: string;
    zh_indicatorlistS: string;
    zh_timeS: string;
    zh_useS: string;
    zh_timeuseS: string;
    zh_keepS: string;
    zh_remarkS: string;
    pic: string;
    subQty?: number;
    subUnit?: string;
    type?: string;
    name_customer?: string;
    nme_customer?: string;
  }

  interface Task_rc {
    id: number;
    sale: number;
    balance: number;
  }

  // ========== OPTIMIZED LOOKUP MAPS ==========
  // Product lookup map - O(1) access instead of O(n) filter
  const productMap = useMemo(() => {
    const map = new Map();
    dataProduct.forEach((p: any) => map.set(p.id, p));
    return map;
  }, [dataProduct]);

  // Product lookup by Barcode - O(1) access for fast scanning
  // รวมบาร์โค้ดสำรอง (สินค้าตัวเดียว หน่วยเดียว หลายบาร์โค้ด) ไว้ใน map เดียวกัน
  // map ชี้ไปตัวสินค้า โค้ดด้านล่างจึงยังอ่าน product.Barcode (หลัก) ลงบิลตามเดิม
  const productMapByBarcode = useMemo(
    () => buildBarcodeIndex(dataProduct, barcodeAliases),
    [dataProduct, barcodeAliases]
  );

  // ========== FAST BARCODE SCANNING HANDLER ==========
  useEffect(() => {
    if (!scannedBarcode || scannedBarcode === "") return;

    const product = productMapByBarcode.get(normalizeBarcode(scannedBarcode));
    if (!product) {
      console.log("Barcode not found:", scannedBarcode);
      return;
    }

    const productId = product.id;
    const existingItem = list.find(
      (item: any) => item.id_product === productId,
    );

    if (existingItem) {
      // Product exists in list - increase quantity
      setList((prevList) =>
        prevList.map((task: any) =>
          task.id_product === productId
            ? {
              ...task,
              qty: task.qty + 1,
              total: (task.qty + 1) * task.diff,
              costtotal: (task.qty + 1) * task.cost,
              totalgift: (task.qty + 1) * task.gift,
            }
            : task,
        ),
      );
    } else {
      // New product - find lot info and add to list
      const code = product.code;
      const rcItems = sortedRCData.filter(
        (r: any) =>
          r.itemcode === code && (r.balance == null || r.qty > r.sale),
      );
      const lot_id = rcItems.map((r: any) => r.id);
      const lot_RC = rcItems.map((r: any) => r.lot);
      const lot_qty = rcItems.map((r: any) => r.qty);
      const lot_sale = rcItems.map((r: any) => r.sale);
      // ทุนสุทธิหลังหักส่วนลด — ต้องใช้สูตรเดียวกับหน้าขายบนเว็บ ไม่งั้นบิลจากมือถือ
      // จะบันทึกทุนคนละมาตรฐานกับบิลหน้าร้าน (ดู src/lib/lotCost.ts)
      const cost = lotUnitCost(rcItems[0] as any) || product.CostActual || 0;

      const price =
        paystore === "หน้าร้าน"
          ? Number(product.price || 0)
          : paystore === "ขายส่ง"
            ? Number(product.wholesaleprice || 0)
            : paystore === "สมาชิก"
              ? (Number(product.online || 0) > 0 ? Number(product.online) : Number(product.price || 0))
              : paystore === "ราคา A"
                ? Number(product.PriceA || 0)
                : paystore === "ราคา B"
                  ? Number(product.PriceB || 0)
                  : paystore === "ราคา C"
                    ? Number(product.PriceC || 0)
                    : paystore === "ราคา D"
                      ? Number(product.PriceD || 0)
                      : paystore === "ราคา E"
                        ? Number(product.PriceE || 0)
                        : paystore === "ราคา F"
                          ? Number(product.PriceF || 0)
                          : paystore === "ราคา G"
                            ? Number(product.PriceG || 0)
                            : Number(product.PriceH || 0);

      const labelData = labelByCode.get(code);
      const giftData = giftByCode.get(code);
      const gift_p = Number(giftData?.gift || 0);

      setList((prevList) => [
        ...prevList,
        {
          id: productId,
          company: localStorage.getItem("company_") || "",
          id_product: productId,
          code_product: code,
          name_product: product.ProductName,
          fixname: product.fixname || "",
          cetagory: product.Category || "",
          unit: product.Unit || "",
          barcode: product.Barcode || "",
          qty: 1,
          price: price,
          gift: gift_p,
          totalgift: gift_p,
          cost: Number(cost) || 0,
          costtotal: Number(cost) || 0,
          discount: 0,
          diff: price,
          total: price,
          id_receive1: lot_id[0] || 0,
          lot_receive1: lot_RC[0] || "",
          qty_lot1: 1,
          std_qty_lot1: lot_qty[0] || 0,
          sale_qty_lot1: 1 + Number(lot_sale[0] || 0),
          id_receive2: lot_id[1] || 0,
          lot_receive2: "",
          qty_lot2: 0,
          std_qty_lot2: lot_qty[1] || 0,
          sale_qty_lot2: Number(lot_sale[1] || 0),
          id_receive3: lot_id[2] || 0,
          lot_receive3: "",
          qty_lot3: 0,
          std_qty_lot3: lot_qty[2] || 0,
          sale_qty_lot3: Number(lot_sale[2] || 0),
          person: localStorage.getItem("person_") || "",
          statuss: "OK",
          label: true,
          indicatorlistS: labelData?.indicatorlistS || "",
          timeS: labelData?.timeS || "",
          useS: labelData?.useS || "",
          timeuseS: labelData?.timeuseS || "",
          keepS: labelData?.keepS || "",
          remarkS: labelData?.remarkS || "",
          type: "",
          name_customer: "",
          my_indicatorlistS: "",
          my_timeS: "",
          my_useS: "",
          my_timeuseS: "",
          my_keepS: "",
          my_remarkS: "",
          lo_indicatorlistS: "",
          lo_timeS: "",
          lo_useS: "",
          lo_timeuseS: "",
          lo_keepS: "",
          lo_remarkS: "",
          en_indicatorlistS: "",
          en_timeS: "",
          en_useS: "",
          en_timeuseS: "",
          en_keepS: "",
          en_remarkS: "",
          zh_indicatorlistS: "",
          zh_timeS: "",
          zh_useS: "",
          zh_timeuseS: "",
          zh_keepS: "",
          zh_remarkS: "",
          pic: product.pic || "",
        },
      ]);
    }
  }, [scannedBarcode]);

  // Selected product from map
  const selectedProduct = useMemo(() => productMap.get(idF), [productMap, idF]);

  // Sorted RC data - cached to avoid repeated sorting
  const sortedRCData = useMemo(() => {
    return [...dataRCFull]
      .sort(
        (a: any, b: any) =>
          new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.createDate).getTime() - new Date(b.createDate).getTime(),
      );
  }, [dataRCFull]);

  // RC lookup by itemcode - O(1) access
  const rcByItemCode = useMemo(() => {
    const map = new Map<string, any[]>();
    sortedRCData.forEach((rc: any) => {
      const key = rc.itemcode;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rc);
    });
    return map;
  }, [sortedRCData]);

  // Label lookup by code - O(1) access
  const labelByCode = useMemo(() => {
    const map = new Map();
    alllabel.forEach((l: any) => map.set(l.code, l));
    return map;
  }, [alllabel]);

  // Gift lookup by code - O(1) access
  const giftByCode = useMemo(() => {
    const map = new Map();
    giftlist.forEach((g: any) => map.set(g.code_product, g));
    return map;
  }, [giftlist]);

  // Helper function to get product balance keyed by product id (รองรับสินค้ารหัสซ้ำ)
  // Formula matches stock-balance-summary API (เดียวกับหน้าสรุปยอดคงเหลือ)
  const getProductBalance = (productId: number | string | undefined | null): number => {
    if (productId == null || productId === "") return 0;
    return normalizeStockBalance(productBalances.get(Number(productId)) ?? 0);
  };

  // List item lookup by id_product
  const listItemByProductId = useMemo(() => {
    const map = new Map();
    list.forEach((item: any) => map.set(item.id_product, item));
    return map;
  }, [list]);

  // ========== OPTIMIZED PRODUCT DATA EXTRACTION ==========
  const listItem = listItemByProductId.get(idF);
  let qty_e = Number(listItem?.id_product || 0);
  let qty_A = Number(listItem?.qty || 0);
  const id_product_e = Number(selectedProduct?.id || 0);
  const code_product_e = String(selectedProduct?.code || "");
  const name_product_e = String(selectedProduct?.ProductName || "");
  const fixname_e = String(selectedProduct?.fixname || "");
  const barcode_e = String(selectedProduct?.Barcode || "");
  const Category_e = String(selectedProduct?.Category || "");
  const unit_e = String(selectedProduct?.Unit || "");
  const cost_e = String(selectedProduct?.CostActual || "");
  const pic_e = String(selectedProduct?.pic || "");
  const price_e =
    paystore === "หน้าร้าน"
      ? Number(selectedProduct?.price || 0)
      : paystore === "ขายส่ง"
        ? Number(selectedProduct?.wholesaleprice || 0)
        : paystore === "สมาชิก"
          ? (Number(selectedProduct?.online || 0) > 0 ? Number(selectedProduct?.online) : Number(selectedProduct?.price || 0))
          : paystore === "ราคา A"
            ? Number(selectedProduct?.PriceA || 0)
            : paystore === "ราคา B"
              ? Number(selectedProduct?.PriceB || 0)
              : paystore === "ราคา C"
                ? Number(selectedProduct?.PriceC || 0)
                : paystore === "ราคา D"
                  ? Number(selectedProduct?.PriceD || 0)
                  : paystore === "ราคา E"
                    ? Number(selectedProduct?.PriceE || 0)
                    : paystore === "ราคา F"
                      ? Number(selectedProduct?.PriceF || 0)
                      : paystore === "ราคา G"
                        ? Number(selectedProduct?.PriceG || 0)
                        : Number(selectedProduct?.PriceH || 0);

  //  ฉลากยา ไทย
  let code_Prod = code_product_e;
  // ========== OPTIMIZED LABEL LOOKUP ==========
  const labelData = labelByCode.get(String(code_Prod));
  const label_inticator = labelData?.indicatorlistS
    ? [labelData.indicatorlistS]
    : [];
  const label_timeS = labelData?.timeS ? [labelData.timeS] : [];
  const label_useS = labelData?.useS ? [labelData.useS] : [];
  const label_timeuseS = labelData?.timeuseS ? [labelData.timeuseS] : [];
  const label_keepS = labelData?.keepS ? [labelData.keepS] : [];
  const label_remarkS = labelData?.remarkS ? [labelData.remarkS] : [];

  let my_indi = label_inticator;
  let my_timeS = label_timeS;
  let my_useS = label_useS;
  let my_timeuseS = label_timeuseS;
  let my_keepS = label_keepS;
  let my_remarkS = label_remarkS;

  //  ฉลากยา inticator
  const my_label_inticator = indi
    .filter((i: any) => i.list === String(my_indi))
    .map((c: any) => c.list_my);
  const lo_label_inticator = indi
    .filter((i: any) => i.list === String(my_indi))
    .map((c: any) => c.list_lo);
  const en_label_inticator = indi
    .filter((i: any) => i.list === String(my_indi))
    .map((c: any) => c.list_eng);
  const zh_label_inticator = indi
    .filter((i: any) => i.list === String(my_indi))
    .map((c: any) => c.list_zh);

  //  ฉลากยา timeL
  const my_label_timeS = timeL
    .filter((i: any) => i.list === String(my_timeS))
    .map((c: any) => c.list_my);
  const lo_label_timeS = timeL
    .filter((i: any) => i.list === String(my_timeS))
    .map((c: any) => c.list_lo);
  const en_label_timeS = timeL
    .filter((i: any) => i.list === String(my_timeS))
    .map((c: any) => c.list_eng);
  const zh_label_timeS = timeL
    .filter((i: any) => i.list === String(my_timeS))
    .map((c: any) => c.list_zh);

  //  ฉลากยา useS
  const my_label_useS = useL
    .filter((i: any) => i.fullname === String(my_useS))
    .map((c: any) => c.list_my);
  const lo_label_useS = useL
    .filter((i: any) => i.fullname === String(my_useS))
    .map((c: any) => c.list_lo);
  const en_label_useS = useL
    .filter((i: any) => i.fullname === String(my_useS))
    .map((c: any) => c.list_eng);
  const zh_label_useS = useL
    .filter((i: any) => i.fullname === String(my_useS))
    .map((c: any) => c.list_zh);

  //  ฉลากยา timeuseS
  const my_label_timeuseS = timeuseL
    .filter((i: any) => i.list === String(my_timeuseS))
    .map((c: any) => c.list_my);
  const lo_label_timeuseS = timeuseL
    .filter((i: any) => i.list === String(my_timeuseS))
    .map((c: any) => c.list_lo);
  const en_label_timeuseS = timeuseL
    .filter((i: any) => i.list === String(my_timeuseS))
    .map((c: any) => c.list_eng);
  const zh_label_timeuseS = timeuseL
    .filter((i: any) => i.list === String(my_timeuseS))
    .map((c: any) => c.list_zh);

  //  ฉลากยา keepS
  const my_label_keepS = keepL
    .filter((i: any) => i.list === String(my_keepS))
    .map((c: any) => c.list_my);
  const lo_label_keepS = keepL
    .filter((i: any) => i.list === String(my_keepS))
    .map((c: any) => c.list_lo);
  const en_label_keepS = keepL
    .filter((i: any) => i.list === String(my_keepS))
    .map((c: any) => c.list_eng);
  const zh_label_keepS = keepL
    .filter((i: any) => i.list === String(my_keepS))
    .map((c: any) => c.list_zh);

  //  ฉลากยา remarkS
  const my_label_remarkS = RemarkL.filter(
    (i: any) => i.list === String(my_remarkS),
  ).map((c: any) => c.list_my);
  const lo_label_remarkS = RemarkL.filter(
    (i: any) => i.list === String(my_remarkS),
  ).map((c: any) => c.list_lo);
  const en_label_remarkS = RemarkL.filter(
    (i: any) => i.list === String(my_remarkS),
  ).map((c: any) => c.list_eng);
  const zh_label_remarkS = RemarkL.filter(
    (i: any) => i.list === String(my_remarkS),
  ).map((c: any) => c.list_zh);

  // ========== OPTIMIZED GIFT LOOKUP ==========
  const giftData = giftByCode.get(String(code_Prod));
  const gift_p = Number(giftData?.gift || 0);

  const lot_id = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode ===
            String(
              dataProduct
                .filter((supplier: any) => supplier.id === idF)
                .map((supplier: any) => supplier.code),
            ) &&
            (r.balance == null || r.qty > r.sale),
        ),
    ],
  ][0][0].map((lots: any) => lots.id);

  const cost = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode ===
            String(
              dataProduct
                .filter((supplier: any) => supplier.id === idF)
                .map((supplier: any) => supplier.code),
            ) &&
            (r.balance == null || r.qty > r.sale),
        ),
    ],
  ][0][0].map((lots: any) => lotUnitCost(lots));

  const lot_RC = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode ===
            String(
              dataProduct
                .filter((supplier: any) => supplier.id === idF)
                .map((supplier: any) => supplier.code),
            ) &&
            (r.balance == null || r.qty > r.sale),
        ),
    ],
  ][0][0].map((lots: any) => lots.lot);

  const lot_qty = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode ===
            String(
              dataProduct
                .filter((supplier: any) => supplier.id === idF)
                .map((supplier: any) => supplier.code),
            ) &&
            (r.balance == null || r.qty > r.sale),
        ),
    ],
  ][0][0].map((lots: any) => lots.qty);

  const lot_sale = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode ===
            String(
              dataProduct
                .filter((supplier: any) => supplier.id === idF)
                .map((supplier: any) => supplier.code),
            ) &&
            (r.balance == null || r.qty > r.sale),
        ),
    ],
  ][0][0].map((lots: any) => lots.sale);

  //******************************************************************************************* */
  const lot_id_T = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode === editedcode && (r.balance == null || r.qty > r.sale),
        )
        .map((supplier: any) => supplier.id),
    ],
  ][0][0];

  const lot_RC_T = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode === editedcode && (r.balance == null || r.qty > r.sale),
        )
        .map((supplier: any) => supplier.lot),
    ],
  ][0][0];

  const lot_qty_T = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode === editedcode && (r.balance == null || r.qty > r.sale),
        )
        .map((supplier: any) => supplier.qty),
    ],
  ][0][0];

  const lot_sale_T = [
    [
      dataRCFull
        .sort(
          (a: any, b: any) =>
            new Date(a.dateExp).getTime() - new Date(b.dateExp).getTime(),
        )
        .filter(
          (r: any) =>
            r.itemcode === editedcode && (r.balance == null || r.qty > r.sale),
        )
        .map((supplier: any) => supplier.sale),
    ],
  ][0][0];

  // Using cached listItemByProductId instead of filter
  const act_lot0 = Number(listItem?.qty || 0);

  //console.log(list)

  //*******Cut Lot ************************* */
  const cut_lot = () => {
    return setList(
      list.map((task) =>
        task.id_product === idF
          ? {
            ...task,

            qty: Number(task.qty) + 1,
            discount: Number(task.discount),
            total: Number(task.qty + 1) * Number(task.diff),
            cost: Number(task.cost),
            gift: Number(task.gift),
            totalgift: (Number(task.qty) + 1) * Number(task.gift),
            costtotal: (Number(task.qty) + 1) * Number(task.cost),
            sale_qty_lot1:
              act_lot0 + 1 > Number(lot_qty[0]) - Number(lot_sale[0])
                ? Number(lot_qty[0])
                : act_lot0 + 1 + Number(lot_sale[0]),

            sale_qty_lot2:
              act_lot0 +
                1 -
                Number(lot_qty[0]) +
                Number(lot_sale[0]) +
                Number(lot_sale[1]) >
                Number(lot_qty[1]) - Number(lot_sale[1])
                ? Number(lot_qty[1])
                : act_lot0 +
                  1 -
                  Number(lot_qty[0]) +
                  Number(lot_sale[0]) +
                  Number(lot_sale[1]) <
                  0
                  ? 0
                  : isNaN(
                    act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) +
                    Number(lot_sale[1]),
                  ) === true
                    ? 0
                    : act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) +
                    Number(lot_sale[1]),
            sale_qty_lot3:
              act_lot0 +
                1 -
                Number(lot_qty[0]) +
                Number(lot_sale[0]) -
                Number(lot_qty[1]) +
                Number(lot_sale[1]) +
                Number(lot_sale[2]) >
                Number(lot_qty[2]) - Number(lot_sale[2])
                ? Number(lot_qty[2])
                : act_lot0 +
                  1 -
                  Number(lot_qty[0]) +
                  Number(lot_sale[0]) -
                  Number(lot_qty[1]) +
                  Number(lot_sale[1]) +
                  Number(lot_sale[2]) <
                  0
                  ? 0
                  : isNaN(
                    act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) -
                    Number(lot_qty[1]) +
                    Number(lot_sale[1]) +
                    Number(lot_sale[2]),
                  ) === true
                    ? 0
                    : act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) -
                    Number(lot_qty[1]) +
                    Number(lot_sale[1]) +
                    Number(lot_sale[2]),
            qty_lot1:
              act_lot0 + 1 > Number(lot_qty[0]) - Number(lot_sale[0])
                ? Number(lot_qty[0]) - Number(lot_sale[0])
                : act_lot0 + 1,

            qty_lot2:
              act_lot0 +
                1 -
                Number(lot_qty[0]) +
                Number(lot_sale[0]) +
                Number(lot_sale[1]) >
                Number(lot_qty[1]) - Number(lot_sale[1])
                ? Number(lot_qty[1]) - Number(lot_sale[1])
                : act_lot0 +
                  1 -
                  Number(lot_qty[0]) +
                  Number(lot_sale[0]) +
                  Number(lot_sale[1]) <
                  0
                  ? 0
                  : isNaN(
                    act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) +
                    Number(lot_sale[1]),
                  ) === true
                    ? 0
                    : act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) +
                    Number(lot_sale[1]),
            qty_lot3:
              act_lot0 +
                1 -
                Number(lot_qty[0]) +
                Number(lot_sale[0]) -
                Number(lot_qty[1]) +
                Number(lot_sale[1]) +
                Number(lot_sale[2]) >
                Number(lot_qty[2]) - Number(lot_sale[2])
                ? Number(lot_qty[2]) - Number(lot_sale[2])
                : act_lot0 +
                  1 -
                  Number(lot_qty[0]) +
                  Number(lot_sale[0]) -
                  Number(lot_qty[1]) +
                  Number(lot_sale[1]) +
                  Number(lot_sale[2]) <
                  0
                  ? 0
                  : isNaN(
                    act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) -
                    Number(lot_qty[1]) +
                    Number(lot_sale[1]) +
                    Number(lot_sale[2]),
                  ) === true
                    ? 0
                    : act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) -
                    Number(lot_qty[1]) +
                    Number(lot_sale[1]) +
                    Number(lot_sale[2]),
            lot_receive2:
              act_lot0 +
                1 -
                Number(lot_qty[0]) +
                Number(lot_sale[0]) +
                Number(lot_sale[1]) >
                Number(lot_qty[1])
                ? lot_RC[1]
                : act_lot0 +
                  1 -
                  Number(lot_qty[0]) +
                  Number(lot_sale[0]) +
                  Number(lot_sale[1]) <
                  0
                  ? ""
                  : isNaN(
                    act_lot0 +
                    1 -
                    Number(lot_qty[0]) +
                    Number(lot_sale[0]) +
                    Number(lot_sale[1]),
                  ) === true
                    ? ""
                    : act_lot0 +
                      1 -
                      Number(lot_qty[0]) +
                      Number(lot_sale[0]) +
                      Number(lot_sale[1]) ===
                      0
                      ? ""
                      : lot_RC[1],

            lot_receive3:
              act_lot0 +
                1 -
                Number(lot_qty[0]) +
                Number(lot_sale[0]) -
                Number(lot_qty[1]) +
                Number(lot_sale[1]) +
                Number(lot_sale[2]) >
                Number(lot_qty[2])
                ? lot_RC[1]
                : act_lot0 +
                  1 -
                  Number(lot_qty[0]) +
                  Number(lot_sale[0]) -
                  Number(lot_qty[1]) +
                  Number(lot_sale[1]) +
                  Number(lot_sale[2]) <
                  0
                  ? ""
                  : isNaN(
                    act_lot0 +
                    1 -
                    Number(lot_qty[0]) -
                    Number(lot_qty[1]) +
                    Number(lot_sale[1]) +
                    Number(lot_sale[2]),
                  ) === true
                    ? ""
                    : act_lot0 +
                      1 -
                      Number(lot_qty[0]) +
                      Number(lot_sale[0]) -
                      Number(lot_qty[1]) +
                      Number(lot_sale[1]) +
                      Number(lot_sale[2]) ===
                      0
                      ? ""
                      : lot_RC[2],
          }
          : {
            ...task,
            qty: Number(task.qty),
            total: Number(task.qty) * Number(task.price),
          },
      ),
    );
  };
  //  Qty Manual
  const cut_lot_Price_manual_inline = (itemCode: string, newQty: string) => {
    const qty = Number(newQty);
    if (isNaN(qty) || qty < 1) return;

    // We need to get the lot info for this specific itemCode since the logic depends on it
    const lot_id_T = sortedRCData
      .filter(
        (r: any) =>
          r.itemcode === itemCode && (r.balance == null || r.qty > r.sale),
      )
      .map((supplier: any) => supplier.id);
    const lot_RC_T = sortedRCData
      .filter(
        (r: any) =>
          r.itemcode === itemCode && (r.balance == null || r.qty > r.sale),
      )
      .map((supplier: any) => supplier.lot);
    const lot_qty_T = sortedRCData
      .filter(
        (r: any) =>
          r.itemcode === itemCode && (r.balance == null || r.qty > r.sale),
      )
      .map((supplier: any) => supplier.qty);
    const lot_sale_T = sortedRCData
      .filter(
        (r: any) =>
          r.itemcode === itemCode && (r.balance == null || r.qty > r.sale),
      )
      .map((supplier: any) => supplier.sale);

    setList((prevList) =>
      prevList.map((task) =>
        task.code_product === itemCode
          ? {
            ...task,

            qty: qty,
            total: qty * Number(task.diff),
            cost: Number(task.cost),
            costtotal: qty * Number(task.cost),
            gift: Number(task.gift),
            totalgift: qty * Number(task.gift),
            sale_qty_lot1:
              qty > Number(lot_qty_T[0]) - Number(lot_sale_T[0])
                ? Number(lot_qty_T[0])
                : qty + Number(lot_sale_T[0]),

            sale_qty_lot2:
              qty -
                Number(lot_qty_T[0]) +
                Number(lot_sale_T[0]) +
                Number(lot_sale_T[1]) >
                Number(lot_qty_T[1]) - Number(lot_sale_T[1])
                ? Number(lot_qty_T[1])
                : qty -
                  Number(lot_qty_T[0]) +
                  Number(lot_sale_T[0]) +
                  Number(lot_sale_T[1]) <
                  0
                  ? 0
                  : isNaN(
                    qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) +
                    Number(lot_sale_T[1]),
                  ) === true
                    ? 0
                    : qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) +
                    Number(lot_sale_T[1]),
            sale_qty_lot3:
              qty -
                Number(lot_qty_T[0]) +
                Number(lot_sale_T[0]) -
                Number(lot_qty_T[1]) +
                Number(lot_sale_T[1]) +
                Number(lot_sale_T[2]) >
                Number(lot_qty_T[2]) - Number(lot_sale_T[2])
                ? Number(lot_qty_T[2])
                : qty -
                  Number(lot_qty_T[0]) +
                  Number(lot_sale_T[0]) -
                  Number(lot_qty_T[1]) +
                  Number(lot_sale_T[1]) +
                  Number(lot_sale_T[2]) <
                  0
                  ? 0
                  : isNaN(
                    qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) -
                    Number(lot_qty_T[1]) +
                    Number(lot_sale_T[1]) +
                    Number(lot_sale_T[2]),
                  ) === true
                    ? 0
                    : qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) -
                    Number(lot_qty_T[1]) +
                    Number(lot_sale_T[1]) +
                    Number(lot_sale_T[2]),
            qty_lot1:
              qty > Number(lot_qty_T[0]) - Number(lot_sale_T[0])
                ? Number(lot_qty_T[0]) - Number(lot_sale_T[0])
                : qty,

            qty_lot2:
              qty -
                Number(lot_qty_T[0]) +
                Number(lot_sale_T[0]) +
                Number(lot_sale_T[1]) >
                Number(lot_qty_T[1]) - Number(lot_sale_T[1])
                ? Number(lot_qty_T[1]) - Number(lot_sale_T[1])
                : qty -
                  Number(lot_qty_T[0]) +
                  Number(lot_sale_T[0]) +
                  Number(lot_sale_T[1]) <
                  0
                  ? 0
                  : isNaN(
                    qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) +
                    Number(lot_sale_T[1]),
                  ) === true
                    ? 0
                    : qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) +
                    Number(lot_sale_T[1]),
            qty_lot3:
              qty -
                Number(lot_qty_T[0]) +
                Number(lot_sale_T[0]) -
                Number(lot_qty_T[1]) +
                Number(lot_sale_T[1]) +
                Number(lot_sale_T[2]) >
                Number(lot_qty_T[2]) - Number(lot_sale_T[2])
                ? Number(lot_qty_T[2]) - Number(lot_sale_T[2])
                : qty -
                  Number(lot_qty_T[0]) +
                  Number(lot_sale_T[0]) -
                  Number(lot_qty_T[1]) +
                  Number(lot_sale_T[1]) +
                  Number(lot_sale_T[2]) <
                  0
                  ? 0
                  : isNaN(
                    qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) -
                    Number(lot_qty_T[1]) +
                    Number(lot_sale_T[1]) +
                    Number(lot_sale_T[2]),
                  ) === true
                    ? 0
                    : qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) -
                    Number(lot_qty_T[1]) +
                    Number(lot_sale_T[1]) +
                    Number(lot_sale_T[2]),
            lot_receive2:
              qty -
                Number(lot_qty_T[0]) +
                Number(lot_sale_T[0]) +
                Number(lot_sale_T[1]) >
                Number(lot_qty_T[1])
                ? lot_RC_T[1]
                : qty -
                  Number(lot_qty_T[0]) +
                  Number(lot_sale_T[0]) +
                  Number(lot_sale_T[1]) <
                  0
                  ? ""
                  : isNaN(
                    qty -
                    Number(lot_qty_T[0]) +
                    Number(lot_sale_T[0]) +
                    Number(lot_sale_T[1]),
                  ) === true
                    ? ""
                    : qty -
                      Number(lot_qty_T[0]) +
                      Number(lot_sale_T[0]) +
                      Number(lot_sale_T[1]) ===
                      0
                      ? ""
                      : lot_RC_T[1],

            lot_receive3:
              qty -
                Number(lot_qty_T[0]) +
                Number(lot_sale_T[0]) -
                Number(lot_qty_T[1]) +
                Number(lot_sale_T[1]) +
                Number(lot_sale_T[2]) >
                Number(lot_qty_T[2])
                ? lot_RC_T[1]
                : qty -
                  Number(lot_qty_T[0]) +
                  Number(lot_sale_T[0]) -
                  Number(lot_qty_T[1]) +
                  Number(lot_sale_T[1]) +
                  Number(lot_sale_T[2]) <
                  0
                  ? ""
                  : isNaN(
                    qty -
                    Number(lot_qty_T[0]) -
                    Number(lot_qty_T[1]) +
                    Number(lot_sale_T[1]) +
                    Number(lot_sale_T[2]),
                  ) === true
                    ? ""
                    : qty -
                      Number(lot_qty_T[0]) +
                      Number(lot_sale_T[0]) -
                      Number(lot_qty_T[1]) +
                      Number(lot_sale_T[1]) +
                      Number(lot_sale_T[2]) ===
                      0
                      ? ""
                      : lot_RC_T[2],
          }
          : task,
      ),
    );
  };

  // QtyInput Sub-component for Enter/Blur confirmation
  const QtyInput = ({
    item,
    changepay,
    onConfirm,
  }: {
    item: any;
    changepay: string;
    onConfirm: (code: string, qty: string) => void;
  }) => {
    const [localQty, setLocalQty] = useState(String(item.qty));
    const lastKeyTimeRef = useRef(Date.now());

    useEffect(() => {
      setLocalQty(String(item.qty));
    }, [item.qty]);

    return (
      <input
        disabled={changepay === "1"}
        className={styles.qtyTextInput}
        type="text"
        value={localQty}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          lastKeyTimeRef.current = Date.now();
          setLocalQty(e.target.value);
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const timeSinceLastKey = Date.now() - lastKeyTimeRef.current;
            // Ignore Enter if it comes too fast (likely from barcode scanner)
            if (timeSinceLastKey < 100) {
              e.preventDefault();
              return;
            }
            onConfirm(item.code_product, localQty);
            (e.target as HTMLInputElement).blur();
          } else {
            lastKeyTimeRef.current = Date.now();
          }
        }}
        onBlur={() => onConfirm(item.code_product, localQty)}
      />
    );
  };

  // Discount
  const cut_lot_Discount_manual = () => {
    return setList(
      list.map((task) =>
        task.code_product === editedcode
          ? {
            ...task,

            discount: Number(priceDis),
            diff: Number(task.price) - Number(priceDis),
            total: Number(task.qty) * (Number(task.price) - Number(priceDis)),
          }
          : task,
      ),
    );
  };

  useEffect(() => {
    const fetchPosts = async () => {
      //    console.log(alllabel)

      try {
        //*****List ****** */
        {
          idF === 0
            ? await setList([...list])
            : idF === qty_e
              ? cut_lot()
              : await setList([
                ...list,
                {
                  id: idF,
                  company: localStorage.getItem("company_") || "",
                  id_product: id_product_e,
                  code_product: code_product_e,
                  name_product: name_product_e,
                  fixname: fixname_e,
                  cetagory: Category_e,
                  unit: unit_e,
                  barcode: barcode_e,
                  qty: 1,
                  price: price_e,
                  gift: gift_p,
                  totalgift: gift_p,
                  cost:
                    Number(cost) === 0 || isNaN(Number(cost)) === true
                      ? Number(cost_e)
                      : Number(cost),
                  costtotal:
                    Number(cost) === 0 || isNaN(Number(cost)) === true
                      ? Number(cost_e)
                      : Number(cost),
                  discount: 0,
                  diff: price_e,
                  total: price_e,
                  id_receive1:
                    lot_id[0] === undefined ? 0 : Number(lot_id[0]),
                  lot_receive1: lot_RC[0] === undefined ? "" : lot_RC[0],
                  qty_lot1: 1,
                  std_qty_lot1:
                    lot_qty[0] === undefined ? 0 : Number(lot_qty[0]),
                  sale_qty_lot1: 1 + Number(lot_sale[0]),
                  id_receive2:
                    lot_id[1] === undefined ? 0 : Number(lot_id[1]),
                  lot_receive2: isNaN(lot_RC[1]) === true ? "" : "",
                  qty_lot2: isNaN(lot_qty[1]) === true ? 0 : 0,
                  std_qty_lot2:
                    lot_qty[1] === undefined ? 0 : Number(lot_qty[1]),
                  sale_qty_lot2:
                    isNaN(lot_sale[1]) === true ? 0 : 0 + Number(lot_sale[1]),
                  id_receive3:
                    lot_id[2] === undefined ? 0 : Number(lot_id[2]),
                  lot_receive3: isNaN(lot_RC[2]) === true ? "" : "",
                  qty_lot3: isNaN(lot_qty[2]) === true ? 0 : 0,
                  std_qty_lot3:
                    lot_qty[2] === undefined ? 0 : Number(lot_qty[2]),
                  sale_qty_lot3:
                    isNaN(lot_sale[2]) === true ? 0 : 0 + Number(lot_sale[2]),
                  person: String(localStorage.getItem("person_") || ""),
                  statuss: "OK",

                  label: true,
                  indicatorlistS: String(label_inticator),
                  timeS: String(label_timeS),
                  useS: String(label_useS),
                  timeuseS: String(label_timeuseS),
                  keepS: String(label_keepS),
                  remarkS: String(label_remarkS),
                  my_indicatorlistS: String(my_label_inticator),
                  my_timeS: String(my_label_timeS),
                  my_useS: String(my_label_useS),
                  my_timeuseS: String(my_label_timeuseS),
                  my_keepS: String(my_label_keepS),
                  my_remarkS: String(my_label_remarkS),
                  lo_indicatorlistS: String(lo_label_inticator),
                  lo_timeS: String(lo_label_timeS),
                  lo_useS: String(lo_label_useS),
                  lo_timeuseS: String(lo_label_timeuseS),
                  lo_keepS: String(lo_label_keepS),
                  lo_remarkS: String(lo_label_remarkS),
                  en_indicatorlistS: String(en_label_inticator),
                  en_timeS: String(en_label_timeS),
                  en_useS: String(en_label_useS),
                  en_timeuseS: String(en_label_timeuseS),
                  en_keepS: String(en_label_keepS),
                  en_remarkS: String(en_label_remarkS),
                  zh_indicatorlistS: String(zh_label_inticator),
                  zh_timeS: String(zh_label_timeS),
                  zh_useS: String(zh_label_useS),
                  zh_timeuseS: String(zh_label_timeuseS),
                  zh_keepS: String(zh_label_keepS),
                  zh_remarkS: String(zh_label_remarkS),
                  pic: pic_e,
                },
              ]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchPosts();
    localStorage.setItem("itemlist", String(list.length));
  }, [idF]);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const modal1 = useDisclosure();
  const modal2 = useDisclosure();
  const modalUnitChange = useDisclosure();

  // Unit Change Modal States
  interface UnitOption {
    id: number;
    productCode: string;
    qty: number;
    saleUnit: string;
    subQty: number;
    subUnit: string;
    price: number;
    isBase?: boolean;
  }
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [selectedUnitItem, setSelectedUnitItem] = useState<Task | null>(null);

  // Fetch unit conversion data for a product
  const fetchUnitConversions = async (productCode: string, item: Task) => {
    const companyS = localStorage.getItem("company_") || "";
    try {
      // Get base unit from Datalist
      const datalistRes = await axios.get(
        `/api/${apidatalist}?company=${companyS}&code=${productCode}`,
      );
      const datalistItem = datalistRes.data[0];

      // Get unit conversions
      const unitRes = await axios.get(
        `/api/unitconversion?company=${companyS}&productCode=${productCode}`,
      );
      const unitConversions = unitRes.data;

      const options: UnitOption[] = [];

      // Row 1: Base unit from Datalist
      if (datalistItem) {
        options.push({
          id: 0,
          productCode: productCode,
          qty: 1,
          saleUnit: datalistItem.Unit || "",
          subQty: 1,
          subUnit: datalistItem.Unit || "",
          price: datalistItem.price || 0,
          isBase: true,
        });
      }

      // Row 2+: Unit conversions from UnitConversion model
      unitConversions.forEach((uc: any) => {
        options.push({
          id: uc.id,
          productCode: uc.productCode,
          qty: uc.qty || 1,
          saleUnit: uc.saleUnit || "",
          subQty: uc.subQty || 1,
          // หน่วยย่อยยึดจากหน่วยฐานของสินค้าเสมอ (กันค่าที่ค้างใน UnitConversion.subUnit)
          subUnit: (datalistItem?.Unit) || uc.subUnit || "",
          price: uc.priceRetail || 0,
          isBase: false,
        });
      });

      setUnitOptions(options);
      setSelectedUnitItem(item);
      modalUnitChange.onOpen();
    } catch (error) {
      console.error("Error fetching unit conversions:", error);
    }
  };

  // Handle unit selection
  const handleUnitSelect = (unitOption: UnitOption) => {
    if (!selectedUnitItem) return;

    // Update the item in the list with new unit and price
    setList(
      list.map((task) => {
        if (task.id === selectedUnitItem.id) {
          const newPrice = unitOption.price;
          const newDiff = newPrice - task.discount;
          const newTotal = task.qty * newDiff; // จำนวนสินค้า (qty) * ราคาใหม่ (diff)
          return {
            ...task,
            unit: unitOption.saleUnit,
            price: newPrice,
            diff: newDiff,
            total: newTotal,
            subQty: unitOption.subQty,
            subUnit: unitOption.subUnit,
          };
        }
        return task;
      }),
    );

    modalUnitChange.onClose();
  };

  // Get Item*******************************************************************************
  const [dataitem, setdataitem] = useState([]);
  const [codeproductS, setcodeproductS] = useState("");

  useEffect(() => {
    const useMyHook = async () => {
      try {
        DetailItem();
        DetailItemRC();
        fetchGet_Balance();
        LabelData();
      } catch (e) {
        console.error(e);
      }
    };

    useMyHook();
  }, [Number(codeproductS)]);

  const DetailItem = async () => {
    let companyS = localStorage.getItem("company_") || "";

    try {
      const res = await axios.get(
        `/api/${apidatalist}?company=${companyS}&code=${codeproductS}`,
      );

      setdataitem(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const DetailItemRC = async () => {
    let companyS = localStorage.getItem("company_") || "";

    try {
      const resitemRC = await axios.get(
        `/api/${apidataitemlist}?company=${companyS}&itemcode=${codeproductS}`,
      );
      // const resRC = await axios.get(`/api/${apis}?company=${companyS}`)
      setdateitemRC(resitemRC.data);
      //  setdateRC(resRC.data)
      // console.log(resitemRC.data)
    } catch (error) {
      console.error(error);
    }
  };

  //Get Label Data
  const LabelData = async () => {
    let companyS = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(
        `/api/${apilabeldata}?company=${companyS}&code=${codeproductS}`,
      );
      res.data[0] !== undefined
        ? setlabelitem(res.data[0])
        : setlabelitem(initialValues7);
    } catch (error) {
      console.error(error);
    }
  };

  //******************Get Costomer ************************************************* */

  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [items, setFixname] = useState<{ value: string; label: string }[]>([]);
  const [searchname, setPosts] = useState([]);

  const initialValues4 = {
    names: "",
    totalPoint: "",
    id_main: "",
    id_costomer: "",
    code_costomer: "",
    name_customer: "",
    group_price: "",
    promotion: "",
    pay: "",
    bill: "",
    total: "",
    discount: "",
    sumtotal: "",
    addreward: "",
    usereward: "",
    receivebaht: "",
    person: "",
    statuss: "",
    taxnumber: "",

    qt_date: "",
    qt_enddate: "",
    qt_credit: "",
    qt_number: "",
    qt_orderNo: "",
    qt_status: "",
    qt_person: "",
    qt_remark: "",

    bl_date: "",
    bl_enddate: "",
    bl_credit: "",
    bl_number: "",
    bl_orderNo: "",
    bl_status: "",
    bl_person: "",
    bl_remark: "",

    inv_date: "",
    inv_enddate: "",
    inv_credit: "",
    inv_number: "",
    inv_orderNo: "",
    inv_status: "",
    inv_person: "",
    inv_remark: "",

    re_date: "",
    re_enddate: "",
    re_credit: "",
    re_number: "",
    re_orderNo: "",
    re_status: "",
    re_person: "",
    re_remark: "",

    followup: "",
    solution: "",
    id_history: "",
    count: "",
    statusH: "",
    remark: "",
  };

  const [alldatalist, setatalist] = useState(initialValues4);

  useEffect(() => {
    seachNames();
  }, []);

  const seachNames = async () => {
    let companyS = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(`/api/${apicustomer}?company=${companyS}`);
      setPosts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const id_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.id),
  );
  const code_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.code),
  );
  const name_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.names),
  );
  const address_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.address),
  );
  const numbertax_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.numbertax),
  );
  const tel_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.tel),
  );
  const total_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.totalPoint),
  );
  const drug_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.drugallergy),
  );
  const congen_cus = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.congenitalDisease),
  );
  const totalPont = String(
    searchname
      .filter((supplier: any) => supplier.names === alldatalist.names)
      .map((supplier: any) => supplier.totalPoint),
  );

  //**********Sort Promotion************************************************/
  //new Date().toLocaleDateString('es-US', { day: '2-digit',month: '2-digit',year: 'numeric', })
  let dateNow = new Date().toLocaleDateString("es-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
  let nameCus = name_cus;

  let code_Promotion =
    nameCus == ""
      ? promotionfullS.filter(
        (a: any) =>
          a.conditionid === Number(1) &&
          a.customer === String("ลูกค้าทั้งหมด") &&
          new Date(a.startdate) <= new Date() &&
          new Date(a.enddate) >= new Date(),
      ) //promotionfullS
      : promotionfullS.filter(
        (a: any) =>
          a.conditionid === Number(1) &&
          new Date(a.startdate) <= new Date() &&
          new Date(a.enddate) >= new Date(),
      );

  let sumSale = Number(
    list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
  );

  // Pronotion Percent
  let P_percent = code_Promotion
    .filter(
      (a: any) =>
        Number(sumSale) >= Number(a.pay_condition) && a.unit === "percent",
    )
    .reduce((acc: any, current: any) => {
      const { discount, unit } = current;
      const currentRegionState = acc[unit] ?? {
        perscentTotal: 0,
        bahtTotal: 0,
      };
      acc[unit] = {
        perscentTotal:
          currentRegionState.perscentTotal +
          (Number(discount) * Number(sumSale)) / 100,
      };
      return acc;
    }, {});

  // Pronotion baht
  let P_baht = code_Promotion
    .filter(
      (a: any) =>
        Number(sumSale) >= Number(a.pay_condition) && a.unit === "baht",
    )
    .reduce((acc: any, current: any) => {
      const { discount, unit } = current;
      const currentRegionState = acc[unit] ?? {
        bahtTotal: 0,
      };
      acc[unit] = {
        bahtTotal: currentRegionState.bahtTotal + Number(discount),
      };
      return acc;
    }, {});

  let SumPro = (
    Number(
      P_percent.percent == undefined ? 0 : P_percent.percent.perscentTotal,
    ) + Number(P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal)
  ).toFixed(0);

  /*
list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)>=Number(a.pay_condition)?
 a.unit==="percent"?(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0)*Number(a.discount))/100:
 a.unit==="baht"?Number(a.discount):0
:0*/
  /*************************************************************************** */

  const [changepay, setchangePay] = useState("");

  //*****************Post Sale********** */

  // Post Data RC1

  const Update_ItemRC = async () => {
    const sales_lot = list.map((posts) => ({
      id_receive1: Number(posts.id_receive1),
      qty_lot1: Number(posts.qty_lot1),
      lot_receive1: posts.lot_receive1,
      sale_lot1: Number(posts.sale_qty_lot1),
      balance_lot1: Number(posts.std_qty_lot1) - Number(posts.sale_qty_lot1),
      id_receive2: Number(posts.id_receive2),
      lot_receive2: posts.lot_receive2,
      qty_lot2: Number(posts.qty_lot2),
      sale_lot2: Number(posts.sale_qty_lot2),
      balance_lot2: Number(posts.std_qty_lot2) - Number(posts.sale_qty_lot2),
      id_receive3: Number(posts.id_receive3),
      lot_receive3: posts.lot_receive3,
      qty_lot3: Number(posts.qty_lot3),
      sale_lot3: Number(posts.sale_qty_lot3),
      balance_lot3: Number(posts.std_qty_lot3) - Number(posts.sale_qty_lot3),
    }));
    try {
      await axios.put(`/api/rc1`, {
        sales_lot,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const discount =
    Number(alldatalist.discount || 0) +
    Number(alldatalist.promotion || 0) +
    (isNaN(parseInt(alldatalist.usereward))
      ? 0
      : parseInt(alldatalist.usereward));

  const total =
    list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
  const pay = alldatalist.pay === "cash" ? 1 : 2;

  if (typeof window !== "undefined") {
    // อัปเดต localStorage
    localStorage.setItem("order", JSON.stringify(list));
    localStorage.setItem("salemain", JSON.stringify(alldatalist));
    localStorage.setItem(
      "main",
      JSON.stringify([
        {
          bill: list.length,
          discount,
          total,
          pay,
        },
      ]),
    );

    // Save customer points data for customer display
    const billTotal = list.reduce((acc, curr) => acc + curr.total, 0);
    const pointFromBill =
      SaleS && pointeqS
        ? parseInt(String(billTotal / (Number(SaleS) / Number(pointeqS))))
        : 0;
    const totalPointAfter = Number(total_cus || 0) + pointFromBill;
    localStorage.setItem(
      "customerPoints",
      JSON.stringify({
        code_cus: code_cus || "",
        name_cus: name_cus || "",
        total_cus: total_cus || "0",
        pointFromBill: isNaN(pointFromBill) ? 0 : pointFromBill,
        totalPointAfter: isNaN(totalPointAfter) ? 0 : totalPointAfter,
      }),
    );
  }
  const handlePayment = () => {
    // เมื่อชำระเงินสำเร็จ
    toast.success(
      <div style={{ fontFamily: "Kanit", fontSize: 20 }}>
        ชำระเงินสำเร็จ 🎉
      </div>,
      {
        description: (
          <div style={{ fontFamily: "Kanit", fontSize: 20 }}>
            {" "}
            ลูกค้าชำระสินค้าเรียบร้อยแล้ว
          </div>
        ),
        duration: 3000, // ปิดเองใน 3 วิ
      },
    );
  };

  // Post Data & Post Customer Point
  const SaleMainSubmit = async () => {
    let companyS = localStorage.getItem("company_") || "";
    const HisT = JSON.parse(localStorage.getItem("his") || "");
    const companyall = companyS;
    const id_costomer = Number(alldatalist.id_costomer);
    const code_costomer = alldatalist.code_costomer;
    const group_price = alldatalist.group_price;
    const pay =
      alldatalist.pay === "cash"
        ? "เงินสด"
        : alldatalist.pay === "payment"
          ? "โอน"
          : "";
    const bill = Number(alldatalist.bill);
    const totalall = Number(
      Number(list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0)),
    );
    const discount =
      Number(alldatalist.discount) + Number(alldatalist.promotion);
    const sumtotal = Number(
      Number(
        list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
      ) -
      Number(alldatalist.discount) -
      Number(alldatalist.promotion) -
      Number(parseInt(alldatalist.usereward)),
    );
    const addreward = Number(alldatalist.addreward);
    const usereward = Number(alldatalist.usereward);
    const personall = String(localStorage.getItem("person_") || "");
    const statussall = alldatalist.statuss;
    const sales = list.map((posts) => ({
      company: posts.company,
      id_product: Number(posts.id_product),
      code_product: posts.code_product,
      name_product: posts.name_product,
      cetagory: posts.cetagory,
      fixname: posts.fixname,
      unit: posts.unit,
      cost: Number(posts.costtotal),
      qty: Number(posts.qty),
      subunit: String(posts.subUnit || posts.unit || ""),
      subqty: Number(posts.subQty || 1) * Number(posts.qty),
      price: Number(posts.price),
      gifts: Number(posts.totalgift),
      discount: Number(posts.discount),
      total: Number(posts.total),
      id_receive1: Number(posts.id_receive1),
      lot_receive1: posts.lot_receive1,
      qty_lot1: Number(posts.qty_lot1),
      id_receive2: Number(posts.id_receive2),
      lot_receive2: posts.lot_receive2,
      qty_lot2: Number(posts.qty_lot2),
      id_receive3: Number(posts.id_receive3),
      lot_receive3: posts.lot_receive3,
      qty_lot3: Number(posts.qty_lot3),
      person: String(localStorage.getItem("person_") || ""),
      statuss: posts.statuss,
      type: String(posts.type || ""),
      name_customer: String(posts.name_customer || posts.nme_customer || ""),
      pharmacy: String(localStorage.getItem("ps") || ""),
    }));

    const historys = [
      {
        code_costomer: String(code_costomer),
        company: String(companyS),
        id_costomer: Number(id_costomer),
        name_customer: name_cus,
        duedate: new Date(HisT.map((a: any) => a.duedate).toString()),
        followup: HisT.map((a: any) => a.followup).toString(),
        solution: HisT.map((a: any) => a.solution).toString(),
        id_history: 0,
        count: Number(HisT.map((a: any) => a.count).toString()),
        statusH: HisT.map((a: any) => a.statusH).toString(),
        person: String(localStorage.getItem("person_") || ""),
        remark: "",
      },
    ];

    const point = parseInt(
      String(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ) /
        (Number(SaleS) / Number(pointeqS)),
      ),
    );
    const totalPoint = parseInt(
      String(
        Number(total_cus) +
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ) /
        (Number(SaleS) / Number(pointeqS)),
      ),
    ) - Number(localStorage.getItem("usereward_s") || 0);
    try {
      localStorage.setItem("show", "1");
      //Save Sale
      const res = await axios.post(`/api/sale`, {
        companyall,
        id_costomer,
        code_costomer,
        group_price,
        pay,
        bill,
        totalall,
        discount,
        sumtotal,
        addreward,
        usereward,
        personall,
        statussall,
        sales,
        historys,
      });
      // Svae Cus Point
      id_costomer === 0
        ? ""
        : await axios.put(`/api/${apicustomer}/${id_costomer}`, {
          point,
          totalPoint,
        });

      // ✅ Cut Stock Realtime - ตัด stock แบบ atomic ด้วย FEFO (First Expired, First Out)
      for (const item of list) {
        try {
          await axios.post("/api/cutstock", {
            itemcode: item.code_product,
            quantity: Number((item.subQty || 1) * item.qty),
            company: companyall,
            person: personall,
            transaction_type: "SALE",
          });
        } catch (cutstockError: any) {
          console.error(
            `Cutstock failed for item ${item.code_product}:`,
            cutstockError,
          );
          // Continue with other items even if one fails
        }
      }

      //  Update_ItemRC()
      handlePayment();
      DetailItemRC();

      seachNames();

      setTimeout(() => {
        (deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2"));
        setatalist(initialValues4);

        const dd = [
          {
            followup: String(""),
            solution: String(""),
            id_history: "",
            count: String(""),
            statusH: "",
            duedate: new Date(),
            person: "",
          },
        ];

        localStorage.setItem("his", JSON.stringify(dd));
      }, 30);

      // await  fetchPosts()
      // localStorage.setItem("loadingM","/web/customers")

      return res;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  /*******ข้อมูล Quatation ************************ */
  // Date Real — use Thai timezone
  var dt = new Date();

  let year = parseInt(dt.toLocaleDateString('en-CA', { year: 'numeric', timeZone: 'Asia/Bangkok' }));
  let month = dt.toLocaleDateString('en-CA', { month: '2-digit', timeZone: 'Asia/Bangkok' });
  let day = dt.toLocaleDateString('en-CA', { day: '2-digit', timeZone: 'Asia/Bangkok' });
  /***************************************** */

  const [qt, setqt] = useState([]);

  const fetchQT = async () => {
    let companyS = localStorage.getItem("company_") || "";
    try {
      const res = await axios.get(
        `/api/${apiquatation}?companyall=${companyS}`,
      );
      res.data.length === 0 ? "" : setqt(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  /****************Max QT********************** */
  const [maxS, setMax] = useState("");
  let maxRecN = Number(maxS) == -Infinity ? 100 : Number(maxS) + 1;

  const maxV = async () => {
    let result = qt
      .filter(
        (a: any) => a.qt_orderNo === String(year) + String(month) + String(day),
      )
      .map((pp: any) => pp.qt_number);
    console.log(result);

    let maxValue = Math.max.apply(null, result);
    setMax(String(maxValue));
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValue);
  };

  /****************Max Bill********************** */
  const [maxSB, setMaxB] = useState("");
  let maxRecNB = Number(maxSB) == -Infinity ? 100 : Number(maxSB) + 1;

  const maxVB = async () => {
    let resultB = qt
      .filter(
        (a: any) => a.bl_orderNo === String(year) + String(month) + String(day),
      )
      .map((pp: any) => pp.bl_number);
    console.log(resultB);

    let maxValueB = Math.max.apply(null, resultB);
    setMaxB(String(maxValueB));
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueB);
  };

  /****************Max INVOICE********************** */
  const [maxSI, setMaxI] = useState("");
  let maxRecNI = Number(maxSI) == -Infinity ? 100 : Number(maxSI) + 1;

  const maxVI = async () => {
    let resultI = qt
      .filter(
        (a: any) =>
          a.inv_orderNo === String(year) + String(month) + String(day),
      )
      .map((pp: any) => pp.inv_number);
    console.log(resultI);

    let maxValueI = Math.max.apply(null, resultI);
    setMaxI(String(maxValueI));
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueI);
  };

  /****************Max Re********************** */
  const [maxSR, setMaxR] = useState("");
  let maxRecNR = Number(maxSR) == -Infinity ? 100 : Number(maxSR) + 1;

  const maxVR = async () => {
    let resultR = qt
      .filter(
        (a: any) => a.re_orderNo === String(year) + String(month) + String(day),
      )
      .map((pp: any) => pp.re_number);
    console.log(resultR);

    let maxValueR = Math.max.apply(null, resultR);
    setMaxR(String(maxValueR));
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueR);
  };

  /****************Max Re********************** */
  const [maxST, setMaxT] = useState("");
  let maxRecNT = Number(maxST) == -Infinity ? 100 : Number(maxST) + 1;

  const maxVT = async () => {
    let resultT = qt
      .filter(
        (a: any) =>
          a.tax_orderNo === String(year) + String(month) + String(day),
      )
      .map((pp: any) => pp.tax_number);
    console.log(resultT);

    let maxValueT = Math.max.apply(null, resultT);
    setMaxT(String(maxValueT));
    //setatalist({...alldatalist,qt_number:String(maxValue)})
    console.log(maxValueT);
  };

  /***************************************** */

  const [selectedOption, setSelectedOption] = useState("cash");
  const [itembalance, setbalance] = useState([]);

  const fetchGet_Balance = async () => {
    let companyS = localStorage.getItem("company_") || "";
    if (!codeproductS) {
      setbalance([]);
      return;
    }

    try {
      const product = dataProduct.find((productItem: any) => String(productItem.code) === String(codeproductS));
      const productId = Number(product?.id || idF || 0);
      const idQuery = productId ? `&id=${productId}` : "";
      const response = await axios.get(
        `/api/stock-balance-summary?itemcode=${encodeURIComponent(codeproductS)}&company=${encodeURIComponent(companyS)}${idQuery}`,
      );
      const summaryBalance = getSummaryBalanceValue(response.data);

      setbalance([{ balance: summaryBalance }] as any);
      if (productId) {
        setProductBalances((prev) => {
          const newMap = new Map(prev);
          newMap.set(productId, summaryBalance);
          return newMap;
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  //**************************************** */
  // input Discount
  const Discount_s = () => {
    const [discountS, setdiscountS] = useState("0");
    const [discountPo, setdiscountPo] = useState(alldatalist.promotion);

    useEffect(() => {
      setdiscountPo(localStorage.getItem("discount_Po") || "");
      setdiscountS(localStorage.getItem("discount_s") || "");
    }, [
      Number(discountS),
      Number(discountPo),
      Number(localStorage.getItem("discount_Po") || ""),
    ]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [show2, setShow2] = useState(false);

    const discount =
      Number(alldatalist.discount || 0) +
      Number(alldatalist.promotion || 0) +
      (isNaN(parseInt(alldatalist.usereward))
        ? 0
        : parseInt(alldatalist.usereward));

    const total =
      list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay,
            },
          ]),
        );
      }
    }, [Number(discountS), Number(discountPo), show2]);

    return (
      <>
        <button
          type="button"
          className="btn btn-outline-success "
          style={{
            fontFamily: "Kanit_B",
            width: 80,
            textAlign: "center",
            fontSize: 16,
            height: 35,
            padding: "4px 8px",
          }}
          onClick={() => {
            (setShow2(true),
              localStorage.setItem("discount_s", "0"),
              setSelectedOption("cash"),
              localStorage.setItem(
                "discount_Po",
                String(alldatalist.promotion),
              ));
          }}
        >
          {Number(alldatalist.discount) + Number(alldatalist.promotion)}
        </button>

        <Modal_dc
          show={show2}
          onHide={() => setShow2(false)}
          dialogClassName="modal-90w"
          fullscreen="sm-down"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_dc.Header closeButton>
            <Modal_dc.Title id="example-custom-modal-styling-title">
              <div
                style={{
                  width: "auto",
                  height: 5,
                  fontSize: 14,
                  fontFamily: "Kanit_B",
                }}
              >
                ส่วนลดท้ายบิล
              </div>
            </Modal_dc.Title>
          </Modal_dc.Header>
          <Modal_dc.Body>
            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div
                style={{
                  width: "auto",
                  fontSize: 17,
                  fontFamily: "Kanit",
                  marginTop: 10,
                  textAlign: "center",
                  height: 35,
                }}
              >
                ส่วนลด :{" "}
              </div>

              <input
                className="form-control form-control-sm mt-1"
                style={{
                  width: 50,
                  marginLeft: 10,
                  marginRight: 10,
                  height: 25,
                  fontSize: 18,
                  fontFamily: "Kanit_B",
                  justifyItems: "center",
                }}
                value={discountS}
                onChange={(e) => {
                  (setdiscountS(e.target.value),
                    localStorage.setItem("discount_s", e.target.value));
                }}
              />
              <div
                style={{
                  width: "auto",
                  fontSize: 17,
                  marginTop: 10,
                  fontFamily: "Kanit",
                }}
              >
                บาท
              </div>
            </div>
            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div
                style={{
                  width: "auto",
                  fontSize: 17,
                  fontFamily: "Kanit",
                  marginTop: 10,
                  textAlign: "center",
                  height: 35,
                }}
              >
                ส่วนลดโปรโมชั่น :
              </div>
              {/**  {Number(alldatalist.promotion)}*/}
              <input
                className="form-control form-control-sm mt-1"
                style={{
                  width: 50,
                  marginLeft: 10,
                  marginRight: 10,
                  height: 25,
                  fontSize: 18,
                  fontFamily: "Kanit_B",
                  justifyItems: "center",
                }}
                value={discountPo}
                onChange={(e) => {
                  (setdiscountPo(e.target.value),
                    localStorage.setItem("discount_Po", e.target.value));
                }}
              />

              <div
                style={{
                  width: "auto",
                  fontSize: 17,
                  marginTop: 10,
                  fontFamily: "Kanit",
                }}
              >
                บาท
              </div>
            </div>
            <div
              style={{
                width: "auto",
                fontSize: 17,
                fontFamily: "Kanit_B",
                marginTop: 10,
                textAlign: "left",
                height: 35,
              }}
            >
              ส่วนลดรวม : &nbsp;&nbsp;{Number(discountPo) + Number(discountS)}
              &nbsp;&nbsp; บาท{" "}
            </div>

            {/**Promotion */}
            {code_Promotion.length > 0 ? (
              <div
                className="row-4 mt-1 shadow-sm rounded border  "
                style={{
                  backgroundColor: "white",
                  justifySelf: "center",
                  marginLeft: 10,
                }}
              >
                <div
                  className="d-flex  mt-1 mb-1 "
                  style={{ justifyContent: "center" }}
                >
                  <div
                    className=""
                    style={{ width: 190, justifyItems: "center" }}
                  >
                    <div className={styles.bodydetail_head}>
                      ส่วนลด โปรโมชั่น{" "}
                      {(
                        Number(
                          P_percent.percent == undefined
                            ? 0
                            : P_percent.percent.perscentTotal,
                        ) +
                        Number(
                          P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal,
                        )
                      ).toFixed(0)}{" "}
                      บาท
                    </div>
                  </div>
                </div>
                <div className="" style={{ overflowY: "auto", marginLeft: 5 }}>
                  <Table className="table" size="sm">
                    <thead className="">
                      <tr className="">
                        <th
                          scope="col"
                          className={styles.bodydetailTable_Re}
                          style={{ width: "40%" }}
                        >
                          ชื่อโปรโมชั่น
                        </th>
                        <th
                          scope="col"
                          className={styles.bodydetailTable_Re}
                          style={{ width: "15%" }}
                        >
                          ลูกค้า
                        </th>
                        <th
                          scope="col"
                          className={styles.bodydetailTable_Re}
                          style={{ width: "40%" }}
                        >
                          โปรโมชั่น
                        </th>
                        <th
                          scope="col"
                          className={styles.bodydetailTable_Re}
                          style={{ width: "20%" }}
                        >
                          คำนวณ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="table-group-divider">
                      {code_Promotion.map((a: any) => (
                        <tr className="" key={a.id}>
                          <th
                            scope="row"
                            className={styles.bodydetailTable_Re1}
                            style={{ width: "40%" }}
                          >
                            {a.name_promotion}
                          </th>
                          <td
                            className={styles.bodydetailTable_Re1}
                            style={{ width: "15%" }}
                          >
                            {a.customer}
                          </td>
                          <td
                            className={styles.bodydetailTable_Re1}
                            style={{ width: "40%" }}
                          >
                            {a.msg_condition + " " + a.msg_discount}
                          </td>
                          <td
                            className={styles.bodydetailTable_Re1}
                            style={{ width: "20%" }}
                          >
                            {list
                              .map((num) => num)
                              .reduce((acc, curr) => acc + curr.total, 0) >=
                              Number(a.pay_condition)
                              ? a.unit === "percent"
                                ? (list
                                  .map((num) => num)
                                  .reduce(
                                    (acc, curr) => acc + curr.total,
                                    0,
                                  ) *
                                  Number(a.discount)) /
                                100
                                : a.unit === "baht"
                                  ? Number(a.discount)
                                  : 0
                              : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            ) : (
              ""
            )}
          </Modal_dc.Body>
          <Modal_dc.Footer>
            <button
              className="btn btn-success"
              style={{
                width: 80,
                height: 35,
                fontSize: 17,
                fontFamily: "Kanit",
              }}
              onClick={() => {
                (setShow2(false),
                  setatalist({
                    ...alldatalist,
                    discount: discountS,
                    promotion: discountPo,
                  }),
                  setdiscountS(localStorage.getItem("discount_s") || ""));
                setdiscountPo(localStorage.getItem("discount_Po") || "");
                setSelectedOption("cash");
              }}
            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: 80,
                height: 35,
                fontSize: 17,
                fontFamily: "Kanit",
              }}
              onClick={() => setShow2(false)}
            >
              Close
            </button>
          </Modal_dc.Footer>
        </Modal_dc>
      </>
    );
  };

  // input use reward
  const Usereward_s = () => {
    const [userewardS, setuserewardS] = useState("0");

    const caluserreward =
      Number(pointsetS) === 0
        ? 0
        : (Number(userewardS == undefined ? 0 : userewardS) /
          Number(pointsetS)) *
        Number(discountS);

    useEffect(() => {
      setuserewardS(localStorage.getItem("usereward_s") || "");
    }, [Number(userewardS)]);

    const [show1, setShow1] = useState(false);

    const discount =
      Number(alldatalist.discount || 0) +
      Number(alldatalist.promotion || 0) +
      (isNaN(parseInt(alldatalist.usereward))
        ? 0
        : parseInt(alldatalist.usereward));

    const total =
      list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay,
            },
          ]),
        );
      }
    }, [Number(userewardS), show1]);

    return (
      <>
        <button
          type="button"
          className="btn btn-outline-success "
          style={{
            fontFamily: "Kanit_B",
            width: 80,
            textAlign: "center",
            fontSize: 16,
            height: 35,
            padding: "4px 8px",
          }}
          onClick={() => {
            (setShow1(true),
              localStorage.setItem("usereward_s", "0"),
              setSelectedOption("cash"));
          }}
        >
          {isNaN(parseInt(String(alldatalist.usereward))) === true
            ? 0
            : parseInt(String(alldatalist.usereward))}
        </button>

        <Modal_rw
          show={show1}
          onHide={() => setShow1(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_rw.Header closeButton>
            <Modal_rw.Title id="example-custom-modal-styling-title">
              <div
                style={{
                  width: "auto",
                  height: 5,
                  fontSize: 14,
                  fontFamily: "Kanit_B",
                }}
              >
                ใช้แต้มส่วนลด
              </div>
            </Modal_rw.Title>
          </Modal_rw.Header>
          <Modal_rw.Body>
            <div
              className="col-3"
              style={{
                textAlign: "left",
                fontFamily: "Kanit_B",
                fontSize: 15,
                width: 180,
              }}
            >
              {code_cus}&nbsp;&nbsp;&nbsp;{name_cus}
            </div>
            <div className="d-flex">
              <div
                className="d-flex"
                style={{
                  textAlign: "left",
                  fontFamily: "Kanit",
                  fontSize: 13,
                  width: 80,
                  marginLeft: 10,
                }}
              >
                มีแต้มทั้งหมด :
              </div>
              <div
                className="d-flex"
                style={{
                  textAlign: "center",
                  fontFamily: "Kanit_B",
                  fontSize: 13,
                }}
              >
                {total_cus}
              </div>
              <div
                className="d-flex"
                style={{
                  textAlign: "left",
                  fontFamily: "Kanit",
                  fontSize: 13,
                  width: 80,
                  marginLeft: 10,
                }}
              >
                แต้ม
              </div>
            </div>

            <div
              className="d-flex mt-1"
              style={{ textAlign: "center", height: 40 }}
            >
              <div
                style={{
                  width: "auto",
                  fontSize: 15,
                  fontFamily: "Kanit",
                  marginTop: 10,
                  textAlign: "center",
                  height: 35,
                }}
              >
                {" "}
                ใช้แต้มส่วนลด :{" "}
              </div>

              <input
                defaultValue={0}
                className="form-control form-control-sm mt-1"
                style={{
                  width: 50,
                  marginLeft: 10,
                  marginRight: 10,
                  height: 25,
                  fontSize: 17,
                  fontFamily: "Kanit_B",
                  justifyItems: "center",
                }}
                value={userewardS ?? 0}
                disabled={statusS === "true" ? false : true}
                onChange={(e) => {
                  (setuserewardS(e.target.value),
                    localStorage.setItem("usereward_s", e.target.value));
                }}
              />
              <div
                style={{
                  width: "auto",
                  fontSize: 15,
                  marginTop: 10,
                  fontFamily: "Kanit",
                }}
              >
                แต้ม
              </div>
              <div
                className="d-flex"
                style={{ textAlign: "center", height: 40 }}
              >
                <div
                  style={{
                    width: 80,
                    fontSize: 15,
                    fontFamily: "Kanit",
                    marginTop: 10,
                    textAlign: "center",
                    height: 35,
                  }}
                >
                  คิดเป็น :{" "}
                </div>

                <div
                  style={{
                    width: "auto",
                    fontSize: 15,
                    marginTop: 10,
                    fontFamily: "Kanit",
                    marginRight: 10,
                  }}
                >
                  {isNaN(parseInt(String(caluserreward))) === true
                    ? 0
                    : parseInt(String(caluserreward))}
                </div>
                <div
                  style={{
                    width: 80,
                    fontSize: 15,
                    fontFamily: "Kanit",
                    marginTop: 10,
                    textAlign: "center",
                    height: 35,
                  }}
                >
                  แต้ม{" "}
                </div>
              </div>
            </div>
            <div
              style={{
                width: "auto",
                fontSize: 10,
                marginTop: 10,
                fontFamily: "Kanit",
                color: "GrayText",
              }}
            >
              {statusS === "true"
                ? "เปิด ใช้งานแต้มสะสม"
                : "ปิด ใช้งานแต้มสะสม (เปิดการใช้งานได้ที่ ตั้งค่า => ตั้งค่าแต้มสะสม)"}
            </div>
            <div
              style={{
                width: "auto",
                fontSize: 10,
                marginTop: 10,
                fontFamily: "Kanit",
                color: "GrayText",
              }}
            >
              ซื้อครบ : {SaleS} บาท คิดเป็นแต้ม : {pointeqS} แต้ม และแต้ม :{" "}
              {pointsetS} แต้ม คิดเป็นส่วนลด : {discountS} บาท
            </div>
          </Modal_rw.Body>
          <Modal_rw.Footer>
            <button
              className="btn btn-success"
              style={{
                width: 80,
                height: 35,
                fontSize: 17,
                fontFamily: "Kanit",
              }}
              onClick={() => {
                setShow1(false);
                (setatalist({
                  ...alldatalist,
                  usereward: String(isNaN(caluserreward) ? 0 : caluserreward),
                }),
                  setuserewardS(localStorage.getItem("usereward_s") || ""),
                  setSelectedOption("cash"));
              }}
            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: 80,
                height: 35,
                fontSize: 17,
                fontFamily: "Kanit",
              }}
              onClick={() => setShow1(false)}
            >
              Close
            </button>
          </Modal_rw.Footer>
        </Modal_rw>
      </>
    );
  };

  // input receive Baht
  const Rereveive_s = () => {
    const [receivebahtS, setreceivebahtS] = useState("");
    useEffect(() => {
      setreceivebahtS(localStorage.getItem("receivebaht_s") || "");
    }, [Number(receivebahtS)]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [show3, setShow3] = useState(false);

    const discount =
      Number(alldatalist.discount || 0) +
      Number(alldatalist.promotion || 0) +
      Number(
        isNaN(Number(parseInt(alldatalist.usereward))) === true
          ? 0
          : Number(parseInt(alldatalist.usereward)),
      );

    const total =
      list.reduce((sum, item) => sum + (item.total || 0), 0) - discount;
    const pay = alldatalist.pay === "cash" ? 1 : 2;

    useEffect(() => {
      if (typeof window !== "undefined") {
        // อัปเดต localStorage
        localStorage.setItem("order", JSON.stringify(list));
        localStorage.setItem(
          "main",
          JSON.stringify([
            {
              bill: list.length,
              discount,
              total,
              pay,
            },
          ]),
        );
      }
    }, [Number(receivebahtS), show3]);

    // Use local state receivebahtS for fast typing
    const [localReceive, setLocalReceive] = useState(
      alldatalist.receivebaht || "",
    );

    // Sync local state when alldatalist changes from external source
    useEffect(() => {
      setLocalReceive(alldatalist.receivebaht || "");
    }, [alldatalist.receivebaht]);

    const handleReceiveBlur = () => {
      setatalist({
        ...alldatalist,
        receivebaht: localReceive,
        total: String(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ),
      });

      localStorage.setItem("receivebaht_s", localReceive);
    };

    // Use shared receiveInputRef from parent scope

    return (
      <>
        <input
          ref={receiveInputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="form-control"
          style={{
            fontFamily: "Kanit_B",
            fontSize: 24,
            height: 50,
            width: 120,
            textAlign: "center",
            backgroundColor: "#F3F8FC",
            border: "2px solid #6BA3D8",
            borderRadius: 10,
            color: "#173F6B",
            fontWeight: 600,
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
          }}
          value={localReceive}
          onFocus={(e) => e.target.select()}
          onBlur={handleReceiveBlur}
          onChange={(e) => {
            setLocalReceive(e.target.value);
            // Sync via Enter key or Blur only
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleReceiveBlur();
              setTimeout(() => {
                confirmPaymentRef.current?.focus();
              }, 100);
            }
          }}
        />

        <Modal_rc
          show={show3}
          onHide={() => setShow3(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_rc.Header closeButton>
            <Modal_rc.Title id="example-custom-modal-styling-title">
              <div
                style={{
                  width: "auto",
                  height: 5,
                  fontSize: 14,
                  fontFamily: "Kanit_B",
                }}
              >
                รับเงิน
              </div>
            </Modal_rc.Title>
          </Modal_rc.Header>
          <Modal_rc.Body>
            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
              <div
                style={{
                  width: "auto",
                  fontSize: 17,
                  fontFamily: "Kanit",
                  marginTop: 10,
                  textAlign: "center",
                  height: 35,
                }}
              >
                รับเงินสด :{" "}
              </div>

              <input
                autoFocus
                className="form-control form-control-sm mt-1"
                style={{
                  width: 70,
                  marginLeft: 10,
                  marginRight: 10,
                  height: 25,
                  fontSize: 18,
                  fontFamily: "Kanit_B",
                  justifyItems: "center",
                }}
                value={receivebahtS}
                onChange={(e) => {
                  (setreceivebahtS(e.target.value),
                    localStorage.setItem("receivebaht_s", e.target.value));
                }}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShow3(false);
                    setatalist({
                      ...alldatalist,
                      receivebaht: receivebahtS,
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    });
                    setreceivebahtS(
                      localStorage.getItem("receivebaht_s") || "",
                    );
                  }
                }}
              />
              <div
                style={{
                  width: "auto",
                  fontSize: 17,
                  marginTop: 10,
                  fontFamily: "Kanit",
                }}
              >
                บาท
              </div>
            </div>
            <div className="d-flex mt-2">
              <button
                type="button"
                className="btn btn-outline-secondary "
                onClick={(e) => {
                  (setreceivebahtS("20"),
                    localStorage.setItem("receivebaht_s", "20"),
                    setatalist({
                      ...alldatalist,
                      receivebaht: "20",
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    }),
                    setShow3(false));
                }}
              >
                20
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  (setreceivebahtS("50"),
                    localStorage.setItem("receivebaht_s", "50"),
                    setatalist({
                      ...alldatalist,
                      receivebaht: "50",
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    }),
                    setShow3(false));
                }}
              >
                50
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  (setreceivebahtS("60"),
                    localStorage.setItem("receivebaht_s", "60"),
                    setatalist({
                      ...alldatalist,
                      receivebaht: "60",
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    }),
                    setShow3(false));
                }}
              >
                60
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  (setreceivebahtS("80"),
                    localStorage.setItem("receivebaht_s", "80"),
                    setatalist({
                      ...alldatalist,
                      receivebaht: "80",
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    }),
                    setShow3(false));
                }}
              >
                80
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  (setreceivebahtS("100"),
                    localStorage.setItem("receivebaht_s", "100"),
                    setatalist({
                      ...alldatalist,
                      receivebaht: "100",
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    }),
                    setShow3(false));
                }}
              >
                100
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  (setreceivebahtS("200"),
                    localStorage.setItem("receivebaht_s", "200"),
                    setatalist({
                      ...alldatalist,
                      receivebaht: "200",
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    }),
                    setShow3(false));
                }}
              >
                200
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  (setreceivebahtS("500"),
                    localStorage.setItem("receivebaht_s", "500"),
                    setatalist({
                      ...alldatalist,
                      receivebaht: "500",
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    }),
                    setShow3(false));
                }}
              >
                500
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary "
                style={{ marginLeft: 5 }}
                onClick={(e) => {
                  (setreceivebahtS("1000"),
                    localStorage.setItem("receivebaht_s", "1000"),
                    setatalist({
                      ...alldatalist,
                      receivebaht: "1000",
                      total: String(
                        list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0),
                      ),
                    }),
                    setShow3(false));
                }}
              >
                1000
              </button>
            </div>
          </Modal_rc.Body>
          <Modal_rc.Footer>
            <button
              className="btn btn-success"
              style={{
                width: 80,
                height: 35,
                fontSize: 17,
                fontFamily: "Kanit",
              }}
              onClick={() => {
                (setShow3(false),
                  setatalist({
                    ...alldatalist,
                    receivebaht: receivebahtS,
                    total: String(
                      list
                        .map((num) => num)
                        .reduce((acc, curr) => acc + curr.total, 0),
                    ),
                  }),
                  setreceivebahtS(localStorage.getItem("receivebaht_s") || ""));
              }}
            >
              OK
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: 80,
                height: 35,
                fontSize: 17,
                fontFamily: "Kanit",
              }}
              onClick={() => setShow3(false)}
            >
              Close
            </button>
          </Modal_rc.Footer>
        </Modal_rc>
      </>
    );
  };

  // input Radio Pay
  const Radio_pay = () => {
    const [payS, setpay] = useState("0");

    useEffect(() => {
      setpay(localStorage.getItem("pay_s") || "");
    }, [Number(payS)]);

    const handleOptionChange1 = (e: any) => {
      const { name, value } = e.target;
      setSelectedOption(e.target.value);
      setatalist({
        ...alldatalist,
        pay: e.target.value,
        receivebaht: String(pat_baht),
        total: String(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ),
      });
      localStorage.setItem("pay_s", String(e.target.value));

      // Focus payment button when "โอน" (transfer) is selected
      if (e.target.value === "payment") {
        setTimeout(() => {
          confirmPaymentRef.current?.focus();
        }, 100);
      }
    };

    /*
    setatalist({...alldatalist, receivebaht:"50",
    total:String(list.map(num => num).reduce((acc, curr) => acc + curr.total, 0))})*/

    const pat_baht =
      Number(
        list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
      ) -
      (Number(alldatalist.discount) +
        Number(alldatalist.promotion) +
        Number(
          isNaN(Number(parseInt(alldatalist.usereward))) === true
            ? 0
            : Number(parseInt(alldatalist.usereward)),
        ));

    return (
      <>
        <div className="col">
          <label
            style={{
              fontFamily: "Kanit",
              fontSize: 20,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <input
              type="radio"
              name="cash"
              value="cash"
              checked={selectedOption === "cash"}
              onChange={handleOptionChange1}
              style={{
                marginRight: 12,
                transform: "scale(1.5)",
                cursor: "pointer",
                accentColor: "#0a4bb3ff",
              }}
            />
            เงินสด
          </label>

          <label
            style={{
              fontFamily: "Kanit",
              fontSize: 20,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              marginLeft: 30,
            }}
          >
            <input
              type="radio"
              name="payment"
              value="payment"
              checked={selectedOption === "payment"}
              onChange={handleOptionChange1}
              style={{
                marginRight: 12,
                transform: "scale(1.5)",
                cursor: "pointer",
                accentColor: "#084bb8ff",
              }}
            />
            โอน
          </label>
        </div>
      </>
    );
  };

  const [addhis, setaddhis] = useState(0); // add history

  // Search ลูกค้า
  function Search_Cus() {
    const handleClose = () => setShow(false);

    const [drugs, setdrugs] = useState([]);
    //******* */  Key ค้นหา สินค้า (Optimized for ~4000 records) ************************/
    const [search, setsearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const handleChange = (value: any) => {
      setsearch(value);
    };

    // Debounce search input - wait 400ms after user stops typing
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(search);
      }, 400);
      return () => clearTimeout(timer);
    }, [search]);

    // Memoized filtered data - only recalculates when debouncedSearch or searchname changes
    const data = useMemo(() => {
      const lowercasedValue = debouncedSearch.toLowerCase().trim();

      // If empty or less than 2 characters, show first 100 records
      if (lowercasedValue.length < 2) {
        return searchname.slice(0, 100);
      }

      // Optimized filtering with early exit and limit
      const results: any[] = [];
      const maxResults = 100;

      for (
        let i = 0;
        i < searchname.length && results.length < maxResults;
        i++
      ) {
        const user: any = searchname[i];
        const userCode = (user.code || "").toLowerCase();
        const userTel = (user.tel || "").toLowerCase();
        const userName = (user.names || "").toLowerCase();

        // Check code first (startsWith is fastest)
        if (userCode.startsWith(lowercasedValue)) {
          results.push(user);
          continue;
        }
        // Check tel
        if (userTel.includes(lowercasedValue)) {
          results.push(user);
          continue;
        }
        // Check name last (includes is slowest)
        if (userName.includes(lowercasedValue)) {
          results.push(user);
        }
      }

      return results;
    }, [debouncedSearch, searchname]);

    //***************************************************************** */
    const [show, setShow] = useState(false);

    const [idcusS, setidcus] = useState(0);
    const [sh, setsh] = useState([]);

    const id_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.id),
    );
    const code_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.code),
    );
    const name_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.names),
    );
    const address_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.address),
    );
    const numbertax_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.numbertax),
    );
    const tel_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.tel),
    );
    const total_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.totalPoint),
    );
    const drug_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.drugallergy),
    );
    const congen_cus1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.congenitalDisease),
    );
    const totalPont1 = String(
      searchname
        .filter((supplier: any) => supplier.id === Number(idcusS))
        .map((supplier: any) => supplier.totalPoint),
    );

    const GetHistory = async (id: Number) => {
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(
          `/api/${getsalehistory}?companyall=${companyS}&id_costomer=${Number(id)}`,
        );
        setsh(res.data);
        //   console.log(res.data)
        //   localStorage.setItem("dg",JSON.stringify(res.data))
      } catch (error) {
        console.error(error);
      }
    };

    const GetDrug = async (id: Number) => {
      let companyS = localStorage.getItem("company_") || "";
      try {
        const res = await axios.get(
          `/api/${getdrugg}?company=${companyS}&id_cus=${Number(id)}`,
        );
        setdrugs(res.data);
        console.log(res.data);
        localStorage.setItem("dg", JSON.stringify(res.data));
      } catch (error) {
        console.error(error);
      }
    };

    return (
      <>
        <button
          type="button"
          className="btn btn-outline-dark "
          onClick={() => {
            setShow(true);
          }}
          style={{
            fontFamily: "Kanit",
            textAlign: "left",
            fontSize: 12,
            height: 30,
            width: "45%",
          }}
        >
          คลิก ค้นหา ข้อมูลลูกค้า....
        </button>

        {name_cus === "" ? (
          ""
        ) : (
          <button
            type="button"
            className="btn btn-outline-primary "
            onClick={() => {
              setaddhis(1);
              const dd = [
                {
                  followup: String(""),
                  solution: String(""),
                  id_history: "",
                  count: String(1),
                  statusH: "",
                  duedate: "",
                  person: String(localStorage.getItem("person_") || ""),
                },
              ];
              localStorage.setItem("his", JSON.stringify(dd));
            }}
            style={{
              fontFamily: "Kanit",
              textAlign: "left",
              fontSize: 10,
              height: 30,
              marginLeft: 5,
            }}
          >
            เพิ่ม ติดตามอาการ
          </button>
        )}

        <button
          type="button"
          className="btn btn-outline-warning "
          onClick={() => {
            (setatalist({ ...alldatalist, names: "" }),
              localStorage.setItem("dg", JSON.stringify([])),
              setaddhis(0));
          }}
          style={{
            fontFamily: "Kanit",
            textAlign: "left",
            fontSize: 10,
            height: 30,
            marginLeft: 5,
          }}
        >
          reset
        </button>

        <Modal1
          show={show}
          onHide={() => {
            (setShow(false), setatalist({ ...alldatalist, names: "" }));
          }}
          size="xl"
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal1.Header closeButton>
            <Modal1.Title></Modal1.Title>
          </Modal1.Header>
          <Modal1.Body>
            <div className="row" style={{ minHeight: "80vh", height: "auto", overflow: "hidden" }}>
              {/* Left Column: Search & Customer List */}
              <div
                className="col-12 col-lg-5 d-flex flex-column mb-3 mb-lg-0"
                style={{ height: "auto", maxHeight: "50vh" }}
              >
                <div className={styles.cusModalCard}>
                  <div className={styles.cusModalHeader}>
                    <span>ค้นหาลูกค้า</span>
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 w-100">
                      <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        ค้นหา:
                      </span>
                      <input
                        autoFocus
                        value={search}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && data.length > 0) {
                            const firstResult = data[0];
                            GetDrug(firstResult.id);
                            GetHistory(firstResult.id);
                            setatalist({
                              ...alldatalist,
                              names: firstResult.names,
                            });
                            setShow(false);
                          }
                        }}
                        className="form-control form-control-sm"
                        placeholder="ชื่อ, รหัส, เบอร์โทร..."
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 14,
                          height: 36,
                          minWidth: 0,
                          flex: 1,
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="p-2 flex-grow-1"
                    style={{ overflowY: "auto" }}
                  >
                    <Table hover size="sm" className="mb-0">
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "#fff",
                          zIndex: 1,
                        }}
                      >
                        <tr
                          style={{
                            fontSize: 13,
                            borderBottom: "2px solid #edf2f7",
                          }}
                        >
                          <th className="py-2">รหัส</th>
                          <th className="py-2">ชื่อลูกค้า</th>
                          <th className="py-2 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((post: any) => (
                          <tr
                            key={post.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              (setidcus(post.id), GetHistory(post.id));
                            }}
                          >
                            <td
                              className="align-middle"
                              style={{
                                fontSize: 13,
                                color: "#173F6B",
                                fontFamily: "Kanit_B",
                              }}
                            >
                              {post.code}
                            </td>
                            <td className="align-middle">
                              <div style={{ fontSize: 14, color: "#1e293b" }}>
                                {post.names}
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                📞 {post.tel}
                              </div>
                            </td>
                            <td className="align-middle text-center">
                              <div className="d-flex flex-column flex-sm-row gap-1 justify-content-center">
                                <button
                                  className="btn btn-sm btn-success px-2 py-1"
                                  style={{ fontSize: 12, minWidth: 50 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    GetDrug(post.id);
                                    GetHistory(post.id);
                                    setatalist({
                                      ...alldatalist,
                                      names: post.names,
                                    });
                                    setShow(false);
                                  }}
                                >
                                  เลือก
                                </button>
                                <button
                                  className="btn btn-sm btn-primary px-2 py-1"
                                  style={{ fontSize: 12, minWidth: 50 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setidcus(post.id);
                                    GetHistory(post.id);
                                  }}
                                >
                                  ประวัติ
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Right Column: Customer Details & History */}
              <div
                className="col-12 col-lg-7 d-flex flex-column"
                style={{ height: "auto", maxHeight: "50vh" }}
              >
                <div className={styles.cusModalCard}>
                  <div className={styles.cusModalHeader}>
                    <span>ประวัติการรักษา</span>
                    {id_cus1 !== "0" && (
                      <span
                        className="badge bg-primary rounded-pill"
                        style={{ fontSize: 12 }}
                      >
                        ID: {code_cus1}
                      </span>
                    )}
                  </div>

                  <div
                    className="p-3 flex-grow-1"
                    style={{ overflowY: "auto" }}
                  >
                    {idcusS !== 0 ? (
                      <>
                        {/* Customer Info Summary Card */}
                        <div className={styles.cusInfoGrid}>
                          <div className={styles.cusInfoItem}>
                            <div className={styles.cusInfoLabel}>
                              ชื่อ-นามสกุล
                            </div>
                            <div className={styles.cusInfoValue}>
                              {name_cus1}
                            </div>
                          </div>
                          <div className={styles.cusInfoItem}>
                            <div className={styles.cusInfoLabel}>
                              เบอร์โทรศัพท์
                            </div>
                            <div className={styles.cusInfoValue}>
                              {tel_cus1 || "-"}
                            </div>
                          </div>
                          <div className={styles.cusInfoItem}>
                            <div className={styles.cusInfoLabel}>แต้มสะสม</div>
                            <div
                              className={styles.cusInfoValue}
                              style={{ color: "#eab308" }}
                            >
                              {total_cus1}{" "}
                              <span style={{ fontSize: 10, color: "#64748b" }}>
                                แต้ม
                              </span>
                            </div>
                          </div>
                          <div className={styles.cusInfoItem}>
                            <div className={styles.cusInfoLabel}>
                              แพ้สินค้า / โรคประจำตัว
                            </div>
                            <div
                              className={styles.cusInfoValue}
                              style={{
                                color: drug_cus1 ? "#ef4444" : "#1F9D6B",
                              }}
                            >
                              {drug_cus1 || congen_cus1
                                ? `${drug_cus1 || "-"} / ${congen_cus1 || "-"}`
                                : "ไม่มีข้อมูล"}
                            </div>
                          </div>
                        </div>

                        {/* History Timeline */}
                        <div className="mt-3">
                          <h6
                            style={{
                              fontFamily: "Kanit_B",
                              color: "#475569",
                              marginBottom: 16,
                            }}
                          >
                            รายการประวัติย้อนหลัง
                          </h6>
                          {sh.length > 0 ? (
                            sh.map((s: any) => (
                              <div key={s.id} className={styles.historyEntry}>
                                <div className={styles.historyDate}>
                                  📅{" "}
                                  {new Date(s.createDate).toLocaleDateString(
                                    "th-TH",
                                    {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )}
                                </div>

                                <div className={styles.historyGrid}>
                                  <div className={styles.treatmentList}>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "#94a3b8",
                                        marginBottom: 4,
                                      }}
                                    >
                                      รายการที่ซื้อ:
                                    </div>
                                    {s.sales.map((a: any) => (
                                      <div
                                        key={a.id}
                                        className={styles.treatmentItem}
                                      >
                                        <span style={{ fontWeight: 600 }}>
                                          {a.qty}x
                                        </span>{" "}
                                        {a.name_product}
                                      </div>
                                    ))}
                                  </div>

                                  <div>
                                    {s.historys.map((b: any) => (
                                      <div
                                        key={b.id}
                                        className={styles.followupBox}
                                      >
                                        <div
                                          style={{
                                            fontWeight: 600,
                                            color: "#92400e",
                                            marginBottom: 4,
                                          }}
                                        >
                                          อาการ & การรักษา
                                        </div>
                                        <div className="mb-2">{b.followup}</div>
                                        <div
                                          style={{
                                            fontSize: 11,
                                            color: "#64748b",
                                            whiteSpace: "pre-line",
                                          }}
                                        >
                                          {(b.solution ?? "")
                                            .split("*")
                                            .map((item: any) => item.trim())
                                            .filter(Boolean)
                                            .join("\n• ")}
                                        </div>
                                        {b.duedate && (
                                          <div
                                            className="mt-2 pt-2 border-top"
                                            style={{
                                              fontSize: 10,
                                              color: "#b45309",
                                            }}
                                          >
                                            🔔 ติดตามผล:{" "}
                                            {new Date(
                                              b.duedate,
                                            ).toLocaleDateString("th-TH")}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div
                              className="text-center py-5"
                              style={{ color: "#94a3b8" }}
                            >
                              <div style={{ fontSize: 40, marginBottom: 10 }}>
                                📂
                              </div>
                              <div>ไม่พบประวัติการรักษา</div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div
                        className="h-100 d-flex flex-column align-items-center justify-content-center text-center py-5"
                        style={{ color: "#94a3b8" }}
                      >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                        <h5 style={{ fontFamily: "Kanit_B" }}>
                          กรุณาเลือกรายชื่อลูกค้า
                        </h5>
                        <p style={{ fontSize: 14 }}>
                          เพื่อแสดงข้อมูลรายบุคคลและประวัติการรักษา
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Modal1.Body>
          {/**   <Modal1.Footer>
          <Button1
                variant="secondary"
                onClick={handleClose}
                style={{fontFamily:"Kanit" ,textAlign:"left",fontSize:15,color:"white"}}
                >
            ปิด
          </Button1>
          <Button1 
                variant="primary" 
                onClick={handleClose}
                style={{fontFamily:"Kanit" ,textAlign:"left",fontSize:15,color:"white"}}
                >
            เลือก
          </Button1>
        </Modal1.Footer>*/}
        </Modal1>
      </>
    );
  }

  type Props = {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  };

  const SpeechToText: React.FC<Props> = ({
    language = "th-TH",
    continuous = true,
    interimResults = true,
  }) => {
    const [supported, setSupported] = useState<boolean | null>(null);
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState("");
    const [finalTranscript, setFinalTranscript] = useState("");
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const [follow, setfollow] = useState("");
    const [sol, setsol] = useState("");
    const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d;
    });
    const [H, setH] = useState(0);

    // Restore state from localStorage on mount (when component remounts after addhis changes)
    useEffect(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("his") || "[]");
        if (saved.length > 0 && saved[0].followup) {
          setfollow(saved[0].followup);
          setsol(saved[0].solution);
          if (saved[0].duedate) {
            setStartDate(new Date(saved[0].duedate));
          }
        }
      } catch (e) { }
    }, []);

    useEffect(() => {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionClass() as SpeechRecognition;
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => setListening(true);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (!SpeechRecognitionClass) {
          setSupported(false);
          return;
        }
        if (finalText) {
          setFinalTranscript((prev) =>
            prev ? prev + " " + finalText : finalText,
          );
          setfollow((prev) => (prev ? prev + " " + finalText : finalText));
          setInterim("");
        } else {
          setInterim(interimText);
        }
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error", err);
        setListening(false);
      };

      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      setSupported(true);

      return () => {
        recognition.stop();
        recognitionRef.current = null;
      };
    }, [language, continuous, interimResults]);

    const startListening = async () => {
      if (!recognitionRef.current) return;
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Microphone permission denied", err);
      }
    };

    const stopListening = () => {
      recognitionRef.current?.stop();
      setListening(false);
    };

    useEffect(() => {
      // Only set sol from product list if no saved history exists in localStorage
      const saved = JSON.parse(localStorage.getItem("his") || "[]");
      if (saved.length > 0 && saved[0].solution) return;

      const A1 = list
        .filter((d: any) => d.label === true)
        .map(
          (a: any) =>
            "*- " +
            a.fixname +
            " ช่วย " +
            a.indicatorlistS +
            " " +
            a.useS +
            " " +
            a.timeuseS +
            " " +
            a.timeS,
        );

      setsol(
        A1.toString()
          .split(",")
          .map((item) => item.trim())
          .join("\n"),
      );
    }, [Number(idF ?? "")]);

    if (supported === false) {
      return (
        <div className="p-4 border rounded bg-red-50 text-red-700">
          <p>เบราว์เซอร์ของคุณไม่รองรับ Speech Recognition API</p>
          <p>แนะนำใช้ Chrome Desktop หรือ Android</p>
        </div>
      );
    }

    const clearText = () => {
      setFinalTranscript("");
      setfollow("");
      setInterim("");
    };

    const SaveHis = async () => {
      const dd = [
        {
          followup: String(follow ?? ""),
          solution: String(sol ?? ""),
          id_history: "",
          count: String(1),
          statusH: "ติดตามผล",
          duedate: new Date(startDate ?? ""),
          person: String(localStorage.getItem("person_") || ""),
        },
      ];

      localStorage.setItem("his", JSON.stringify(dd));

      const saved = JSON.parse(localStorage.getItem("his") || "[]");
      if (saved.length > 0) {
        setfollow(saved[0].followup);
        setsol(saved[0].solution);
        setStartDate(new Date(saved[0].duedate));
      }

      toast.success(
        <div style={{ fontFamily: "Kanit", fontSize: 14 }}>
          บันทึกประวัติการติดตาม เรียบร้อย ✅
        </div>,
      );
      setaddhis(2);
    };

    return (
      <>
        {addhis === 0 ? (
          ""
        ) : (
          <div className="p-2 border rounded space-y-3 mt-2">
            <div className="flex gap-2">
              <button
                onClick={startListening}
                disabled={listening}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                เริ่มพูด
              </button>
              <button
                onClick={stopListening}
                disabled={!listening}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                หยุด
              </button>
              <button
                onClick={clearText}
                style={{ fontFamily: "kanit", fontSize: 12 }}
                className="px-3 py-1 border rounded"
              >
                ล้างข้อความ
              </button>

              <span
                className="ml-auto text-sm text-gray-600"
                style={{ fontFamily: "kanit", fontSize: 12 }}
              >
                {listening ? "🎙️ กำลังฟัง..." : "⏹️ หยุดฟัง"}
              </span>
            </div>

            <div className="row">
              <div>
                <div className="input-group" style={{ minHeight: 70 }}>
                  <span
                    className="input-group-text"
                    id="visible-addon"
                    style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}
                  >
                    อาการ
                  </span>
                  <textarea
                    className="form-control"
                    aria-label="With textarea"
                    value={follow ?? ""}
                    onChange={(e) => setfollow(e.target.value)}
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <div className="input-group mt-2" style={{ minHeight: 130 }}>
                  <span
                    className="input-group-text"
                    id="visible-addon"
                    style={{ fontFamily: "kanit", fontSize: 12, width: 80 }}
                  >
                    การรักษา
                  </span>
                  <textarea
                    className="form-control"
                    aria-label="With textarea"
                    value={sol ?? ""}
                    onChange={(e) => setsol(e.target.value)}
                    style={{ fontFamily: "kanit", fontSize: 12 }}
                  />
                </div>
              </div>
              <div>
                <div className="row mt-2">
                  <div
                    className="col-2"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 13,
                      width: 115,
                      marginTop: 5,
                    }}
                  >
                    ติดตามผล วันที่ :
                  </div>
                  <div
                    className="col-2"
                    style={{ width: 200, cursor: "pointer" }}
                  >
                    <DatePicker
                      selected={startDate}
                      onChange={(date: any) => setStartDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                    />
                  </div>
                  <div className="col-2" style={{ marginLeft: 10 }}>
                    <button
                      className={"btn btn-warning"}
                      style={{
                        width: 80,
                        height: 35,
                        fontSize: 10,
                        fontFamily: "Kanit",
                      }}
                      onClick={() => {
                        SaveHis();
                      }}
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // input ใบเสนอราคา
  function QuotationTemplate() {
    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);

    // Post Quatation
    const CreateQuatation = async () => {
      let companyS = localStorage.getItem("company_") || "";

      const companyall = companyS;
      const id_costomer = Number(alldatalist.id_costomer);
      const code_costomer = alldatalist.code_costomer;
      const name_costomer = String(name_cus);
      const group_price = alldatalist.group_price;
      const pay =
        alldatalist.pay === "cash"
          ? "เงินสด"
          : alldatalist.pay === "payment"
            ? "โอน"
            : "";
      const bill = Number(alldatalist.bill);
      const totalall = Number(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ),
      );
      const discount =
        Number(alldatalist.discount) + Number(alldatalist.promotion);
      const sumtotal = Number(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ) -
        Number(alldatalist.discount) -
        Number(parseInt(alldatalist.usereward)),
      );
      const addreward = Number(alldatalist.addreward);
      const usereward = Number(alldatalist.usereward);
      const taxnumber =
        String(localStorage.getItem("numbertax_S") || "") === String("notax")
          ? ""
          : String(localStorage.getItem("numbertax_S") || "") ===
            String("three")
            ? "3"
            : String(localStorage.getItem("numbertax_S") || "") ===
              String("seven")
              ? "7"
              : "";
      const personall = String(localStorage.getItem("person_") || "");
      const statussall = alldatalist.statuss;
      const qt_date = new Date(startDate);
      const qt_enddate = new Date(startDate1);
      const qt_credit = Number(daysDiff);
      const qt_number = Number(maxRecN);
      const qt_orderNo = year + month + day;
      const qt_orderfull = "QT" + year + month + day + Number(maxRecN);
      const qt_status = "รออนุมัติ";
      const qt_person = String(localStorage.getItem("person_") || "");
      const qt_remark = "";
      const detailsale = list.map((posts) => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }));

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`, {
          companyall,
          id_costomer,
          code_costomer,
          name_costomer,
          group_price,
          pay,
          bill,
          totalall,
          discount,
          sumtotal,
          addreward,
          usereward,
          personall,
          statussall,
          taxnumber,
          qt_date,
          qt_number,
          qt_orderNo,
          qt_status,
          qt_person,
          qt_remark,
          qt_enddate,
          qt_credit,
          qt_orderfull,

          detailsale,
        });
      } catch (error) {
        console.error(error);
      }
    };

    const handleClick = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 2000));

      await CreateQuatation();
      await fetchQT();
      setShowW(false);

      seachNames();

      setTimeout(() => {
        (deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2"));
        setatalist(initialValues4);
        setMessage("");
      }, 30);

      setLoading(false);
    };

    let taxNum =
      String(localStorage.getItem("numbertax_S") || "") === String("notax")
        ? ""
        : String(localStorage.getItem("numbertax_S") || "") === String("three")
          ? "3"
          : String(localStorage.getItem("numbertax_S") || "") ===
            String("seven")
            ? "7"
            : "";

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState("notax");

    const Radio_tax = () => {
      useEffect(() => {
        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "");
        // fetchQT()
        maxV();
      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {
        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value);
      };
      return (
        <>
          <div className="col">
            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === "notax"} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === "three"} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === "seven"}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
              />
              หักภาษี 7 %
            </label>
          </div>
        </>
      );
    };

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return (
      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>
              ไม่สามารถ สร้างใบเสนอราคาได้ !
            </Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <button
                style={{ fontSize: 14, fontFamily: "Kanit" }}
                onClick={() => setShow(false)}
                className="outline-success"
              >
                ปิด
              </button>
            </div>
          </Alert>

          {!show && (
            <button
              disabled={list.length < 1 ? true : false}
              onClick={() => {
                (name_cus === "" ? setShow(true) : setShowW(true), maxV());
              }}
              type="button"
              className="btn btn-outline-secondary"
              style={{
                width: 110,
                height: 30,
                fontSize: 11,
                marginTop: 5,
                fontFamily: "Kanit",
              }}
            >
              สร้างใบเสนอราคา
            </button>
          )}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div
                style={{
                  width: "auto",
                  height: 20,
                  fontSize: 13,
                  fontFamily: "Kanit",
                }}
              >
                สร้างใบเสนอราคา
              </div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>
            <div
              className="col  "
              style={{
                justifySelf: "center",
                backgroundColor: "white",
                marginLeft: 20,
                marginRight: 20,
              }}
              ref={contentRef}
            >
              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>
                <div className="col ">
                  {/**ผูขาย */}
                  <div
                    className="row mt-4"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    ผู้ขาย
                  </div>
                  <div
                    className="row  "
                    style={{
                      textAlign: "left",
                      fontFamily: "Kanit_B",
                      fontSize: 11,
                    }}
                  >
                    {storeS}
                  </div>
                  <div
                    className="row"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    {addressS}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    เลขที่ผู้เสียภาษี :{taxS}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    โทร : {telS}
                  </div>

                  {/**ผู้ซื้อ */}
                  <div
                    className="row mt-2"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    ผู้ชื้อ
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "Kanit_B",
                      fontSize: 11,
                    }}
                  >
                    {name_cus}
                  </div>
                  <div
                    className="row"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    {address_cus}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    เลขที่ผู้เสียภาษี :{numbertax_cus}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    โทร : {tel_cus}
                  </div>
                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div
                    className="row "
                    style={{
                      textAlign: "center",
                      fontFamily: "Kanit",
                      fontSize: 20,
                      justifySelf: "center",
                    }}
                  >
                    ใบเสนอราคา
                  </div>
                  <div
                    className="mt-1 mb-2"
                    style={{
                      justifySelf: "center",
                      width: "70%",
                      height: 1,
                      backgroundColor: "black",
                    }}
                  ></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        เลขที่ :
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        วันที่ :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        เครดิต :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        วันครบกำหนด :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        ผู้ขาย :
                      </div>
                    </div>
                    <div className="col ">
                      <div
                        className="col "
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        QT{year}
                        {month}
                        {day}
                        {maxRecN}
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        {/**Open */}
                        <div
                          className="border border-black shadow shadow-sm rounded "
                          style={{ width: 130, height: 25 }}
                        >
                          <div
                            style={{ width: 100, marginLeft: 10, marginTop: 2 }}
                          >
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString(
                                "es-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                              selected={startDate}
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        {daysDiff} วัน
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        <div
                          className="border border-black shadow shadow-sm rounded "
                          style={{ width: 130, height: 25 }}
                        >
                          <div
                            style={{ width: 100, marginLeft: 10, marginTop: 2 }}
                          >
                            <DatePicker
                              value={new Date(startDate1).toLocaleDateString(
                                "es-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                              selected={startDate1}
                              onChange={(date: any) => setStartDate1(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-2 mb-2"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        ชื่อผู้ขาย
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-1 mb-2"
                    style={{
                      justifySelf: "center",
                      width: "70%",
                      height: 1,
                      backgroundColor: "black",
                    }}
                  ></div>
                </div>
              </div>

              <div
                className="row mt-3"
                style={{ marginLeft: 20, marginRight: 20 }}
              >
                <div
                  className="d-flex bd-highlight"
                  style={{ justifySelf: "right" }}
                >
                  <div
                    className=" flex-grow-1 bd-highlight"
                    style={{
                      fontFamily: "kanit_B",
                      fontSize: 11,
                      textAlign: "start",
                      height: 15,
                      width: "5vw",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    รายการ
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 45,
                    }}
                  >
                    จำนวน
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    หน่วย
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 70,
                    }}
                  >
                    ราคาต่อหน่วย
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    ลด/ชิ้น
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    รวม
                  </div>
                </div>
                <div
                  className="mt-1 "
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    height: 1,
                    backgroundColor: "black",
                  }}
                ></div>
                <table className="table">
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.map((a: any) => (
                          <div key={a.id} id="selcet-print">
                            <div
                              className="d-flex bd-highlight"
                              style={{ justifyItems: "end" }}
                            >
                              <div
                                className=" flex-grow-1 bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "start",
                                  height: 23,
                                  width: "5vw",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {a.name_product}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "center",
                                  height: 23,
                                  width: 30,
                                }}
                              >
                                {a.qty}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                }}
                              >
                                {a.unit}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 70,
                                }}
                              >
                                {a.price}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                }}
                              >
                                {a.discount}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                  marginRight: 5,
                                }}
                              >
                                {a.total}
                              </div>
                            </div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div
                  className=" "
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    height: 1,
                    backgroundColor: "black",
                  }}
                ></div>
                <div
                  className="row "
                  style={{
                    fontFamily: "kanit",
                    fontSize: 11,
                    justifySelf: "left",
                    marginLeft: 3,
                  }}
                >
                  ทั้งหมด : {list.length} รายการ{" "}
                </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className=" bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          รวมเงิน :
                        </div>
                        <div
                          className=" bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {list
                            .map((num) => num)
                            .reduce((acc, curr) => acc + curr.total, 0)}
                        </div>
                        <div
                          className=" bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          ส่วนลดท้ายบิล :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {Number(alldatalist.discount) +
                            Number(alldatalist.promotion)}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          ใช้แต้มส่วนลด :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {parseInt(String(alldatalist.usereward))}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      {String(taxNum) === "" ? (
                        ""
                      ) : (
                        <div>
                          <div
                            className="d-flex bd-highlight"
                            style={{ justifySelf: "end" }}
                          >
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "right",
                                width: 200,
                                height: 20,
                              }}
                            >
                              จำนวนเงินรวมทั้งสิ้น :
                            </div>
                            <div
                              className="bd-highlight ml-1 mr-1"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "center",
                                width: 70,
                                height: 20,
                              }}
                            >
                              {Number(
                                list
                                  .map((num) => num)
                                  .reduce((acc, curr) => acc + curr.total, 0),
                              ) -
                                Number(alldatalist.discount) -
                                Number(alldatalist.promotion) -
                                Number(parseInt(alldatalist.usereward))}
                            </div>
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "left",
                                width: 20,
                                height: 20,
                              }}
                            >
                              บาท
                            </div>
                          </div>
                          <div
                            className="row"
                            style={{
                              justifySelf: "right",
                              width: "32%",
                              height: 1,
                              backgroundColor: "black",
                            }}
                          ></div>
                          <div
                            className="d-flex bd-highlight"
                            style={{ justifySelf: "end" }}
                          >
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "right",
                                width: 200,
                                height: 20,
                              }}
                            >
                              หักภาษี ณ ที่จ่าย {String(taxNum)} % :
                            </div>
                            <div
                              className="bd-highlight ml-1 mr-1"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "center",
                                width: 70,
                                height: 20,
                              }}
                            >
                              {(
                                ((Number(
                                  list
                                    .map((num) => num)
                                    .reduce((acc, curr) => acc + curr.total, 0),
                                ) -
                                  Number(alldatalist.discount) -
                                  Number(alldatalist.promotion) -
                                  Number(parseInt(alldatalist.usereward))) *
                                  Number(taxNum)) /
                                100
                              ).toFixed(1)}
                            </div>
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "left",
                                width: 20,
                                height: 20,
                              }}
                            >
                              บาท
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 30,
                          }}
                        >
                          ยอดชำระทั้งหมด :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 30,
                          }}
                        >
                          {(
                            Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) -
                            Number(alldatalist.discount) -
                            Number(alldatalist.promotion) -
                            Number(parseInt(alldatalist.usereward)) +
                            ((Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) -
                              Number(alldatalist.discount) -
                              Number(alldatalist.promotion) -
                              Number(parseInt(alldatalist.usereward))) *
                              Number(taxNum)) /
                            100
                          ).toFixed(1)}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 30,
                          }}
                        >
                          บาท
                        </div>
                      </div>
                      <div
                        className="row"
                        style={{
                          justifySelf: "right",
                          width: "32%",
                          height: 1,
                          backgroundColor: "black",
                        }}
                      ></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  ">
                        <div
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "Kanit",
                            fontSize: 11,
                            height: 60,
                          }}
                        >
                          ในนาม {name_cus}
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          .......................................................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ผู้สั่งซื้อสินค้า
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ........../............/.....................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          วันที่
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="col-sm-1"
                    style={{ justifyItems: "center" }}
                  ></div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  ">
                        <div
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "Kanit",
                            fontSize: 11,
                            height: 60,
                          }}
                        >
                          ในนาม {storeS}
                        </div>
                      </div>

                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ......................................................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ผู้อนุมัติ
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ........./.........../....................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          วันที่
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={reactToPrintFn2}
            >
              Print
            </button>

            <button
              className="btn btn-success"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={handleClick}
            >
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={() => setShowW(false)}
            >
              ปิด
            </button>
          </Modal_qa.Footer>
        </Modal_qa>
      </>
    );
  }

  // input ใบวางบิล
  function BillTemplate() {
    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);

    // Post Quatation
    const CreateBill = async () => {
      let companyS = localStorage.getItem("company_") || "";

      const companyall = companyS;
      const id_costomer = Number(alldatalist.id_costomer);
      const code_costomer = alldatalist.code_costomer;
      const name_costomer = String(name_cus);
      const group_price = alldatalist.group_price;
      const pay =
        alldatalist.pay === "cash"
          ? "เงินสด"
          : alldatalist.pay === "payment"
            ? "โอน"
            : "";
      const bill = Number(alldatalist.bill);
      const totalall = Number(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ),
      );
      const discount =
        Number(alldatalist.discount) + Number(alldatalist.promotion);
      const sumtotal = Number(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ) -
        Number(alldatalist.discount) -
        Number(parseInt(alldatalist.usereward)),
      );
      const addreward = Number(alldatalist.addreward);
      const usereward = Number(alldatalist.usereward);
      const taxnumber =
        String(localStorage.getItem("numbertax_S") || "") === String("notax")
          ? ""
          : String(localStorage.getItem("numbertax_S") || "") ===
            String("three")
            ? "3"
            : String(localStorage.getItem("numbertax_S") || "") ===
              String("seven")
              ? "7"
              : "";
      const personall = String(localStorage.getItem("person_") || "");
      const statussall = alldatalist.statuss;
      const bl_date = new Date(startDate);
      const bl_enddate = new Date(startDate1);
      const bl_credit = Number(daysDiff);
      const bl_number = Number(maxRecNB);
      const bl_orderNo = year + month + day;
      const bl_orderfull = "BL" + year + month + day + Number(maxRecNB);
      const bl_status = "รออนุมัติ";
      const bl_person = "";
      const bl_remark = "";
      const detailsale = list.map((posts) => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }));

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`, {
          companyall,
          id_costomer,
          code_costomer,
          name_costomer,
          group_price,
          pay,
          bill,
          totalall,
          discount,
          sumtotal,
          addreward,
          usereward,
          personall,
          statussall,
          taxnumber,
          bl_date,
          bl_number,
          bl_orderNo,
          bl_status,
          bl_person,
          bl_remark,
          bl_enddate,
          bl_credit,
          bl_orderfull,

          detailsale,
        });
      } catch (error) {
        console.error(error);
      }
    };

    const handleClick = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill();
      await fetchQT();
      setShowW(false);

      seachNames();
      setTimeout(() => {
        (deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2"));
        setatalist(initialValues4);
        setMessage("");
      }, 30);

      setLoading(false);
    };

    let taxNum =
      String(localStorage.getItem("numbertax_S") || "") === String("notax")
        ? ""
        : String(localStorage.getItem("numbertax_S") || "") === String("three")
          ? "3"
          : String(localStorage.getItem("numbertax_S") || "") ===
            String("seven")
            ? "7"
            : "";

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState("notax");

    const Radio_tax = () => {
      useEffect(() => {
        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "");
        // fetchQT()
        maxVB();
      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {
        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value);
      };
      return (
        <>
          <div className="col">
            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === "notax"} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === "three"} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === "seven"}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
              />
              หักภาษี 7 %
            </label>
          </div>
        </>
      );
    };

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return (
      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>
              ไม่สามารถ สร้างใบวางบิลได้ !
            </Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <button
                style={{ fontSize: 14, fontFamily: "Kanit" }}
                onClick={() => setShow(false)}
                className="outline-success"
              >
                ปิด
              </button>
            </div>
          </Alert>

          {!show && (
            <button
              disabled={list.length < 1 ? true : false}
              onClick={() => {
                name_cus === "" ? setShow(true) : setShowW(true);
              }}
              type="button"
              className="btn btn-outline-secondary"
              style={{
                width: 100,
                height: 30,
                fontSize: 12,
                marginLeft: 10,
                marginTop: 5,
                fontFamily: "Kanit",
              }}
            >
              สร้างใบวางบิล
            </button>
          )}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div
                style={{
                  width: "auto",
                  height: 20,
                  fontSize: 13,
                  fontFamily: "Kanit",
                }}
              >
                สร้างใบวางบิล
              </div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>
            <div
              className="col  "
              style={{
                justifySelf: "center",
                backgroundColor: "white",
                marginLeft: 20,
                marginRight: 20,
              }}
              ref={contentRef}
            >
              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>
                <div className="col ">
                  {/**ผูขาย */}
                  <div
                    className="row mt-4"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    ผู้ขาย
                  </div>
                  <div
                    className="row  "
                    style={{
                      textAlign: "left",
                      fontFamily: "Kanit_B",
                      fontSize: 11,
                    }}
                  >
                    {storeS}
                  </div>
                  <div
                    className="row"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    {addressS}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    เลขที่ผู้เสียภาษี :{taxS}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    โทร : {telS}
                  </div>

                  {/**ผู้ซื้อ */}
                  <div
                    className="row mt-2"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    ผู้ชื้อ
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "Kanit_B",
                      fontSize: 11,
                    }}
                  >
                    {name_cus}
                  </div>
                  <div
                    className="row"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    {address_cus}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    เลขที่ผู้เสียภาษี :{numbertax_cus}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    โทร : {tel_cus}
                  </div>
                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div
                    className="row "
                    style={{
                      textAlign: "center",
                      fontFamily: "Kanit",
                      fontSize: 20,
                      justifySelf: "center",
                    }}
                  >
                    ใบวางบิล
                  </div>
                  <div
                    className="mt-1 mb-2"
                    style={{
                      justifySelf: "center",
                      width: "70%",
                      height: 1,
                      backgroundColor: "black",
                    }}
                  ></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        เลขที่ :
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        วันที่ :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        เครดิต :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        วันครบกำหนด :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        ผู้ขาย :
                      </div>
                    </div>
                    <div className="col ">
                      <div
                        className="col "
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        BL{year}
                        {month}
                        {day}
                        {maxRecNB}
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        {/**Open */}
                        <div
                          className="border border-black shadow shadow-sm rounded "
                          style={{ width: 130, height: 25 }}
                        >
                          <div
                            style={{ width: 100, marginLeft: 10, marginTop: 2 }}
                          >
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString(
                                "es-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                              //  selected={startDate}
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        {daysDiff} วัน
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        <div
                          className="border border-black shadow shadow-sm rounded "
                          style={{ width: 130, height: 25 }}
                        >
                          <div
                            style={{ width: 100, marginLeft: 10, marginTop: 2 }}
                          >
                            <DatePicker
                              value={new Date(startDate1).toLocaleDateString(
                                "es-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                              //selected={startDate1}
                              onChange={(date: any) => setStartDate1(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-2 mb-2"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        ชื่อผู้ขาย
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-1 mb-2"
                    style={{
                      justifySelf: "center",
                      width: "70%",
                      height: 1,
                      backgroundColor: "black",
                    }}
                  ></div>
                </div>
              </div>

              <div
                className="row mt-3"
                style={{ marginLeft: 20, marginRight: 20 }}
              >
                <div
                  className="d-flex bd-highlight"
                  style={{ justifySelf: "right" }}
                >
                  <div
                    className=" flex-grow-1 bd-highlight"
                    style={{
                      fontFamily: "kanit_B",
                      fontSize: 11,
                      textAlign: "start",
                      height: 15,
                      width: "5vw",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    รายการ
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 45,
                    }}
                  >
                    จำนวน
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    หน่วย
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 70,
                    }}
                  >
                    ราคาต่อหน่วย
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    ลด/ชิ้น
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    รวม
                  </div>
                </div>
                <div
                  className="mt-1 "
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    height: 1,
                    backgroundColor: "black",
                  }}
                ></div>
                <table className="table">
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.map((a: any) => (
                          <div key={a.id} id="selcet-print">
                            <div
                              className="d-flex bd-highlight"
                              style={{ justifyItems: "end" }}
                            >
                              <div
                                className=" flex-grow-1 bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "start",
                                  height: 23,
                                  width: "5vw",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {a.name_product}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "center",
                                  height: 23,
                                  width: 30,
                                }}
                              >
                                {a.qty}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                }}
                              >
                                {a.unit}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 70,
                                }}
                              >
                                {a.price}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                }}
                              >
                                {a.discount}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                  marginRight: 5,
                                }}
                              >
                                {a.total}
                              </div>
                            </div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div
                  className=" "
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    height: 1,
                    backgroundColor: "black",
                  }}
                ></div>
                <div
                  className="row "
                  style={{
                    fontFamily: "kanit",
                    fontSize: 11,
                    justifySelf: "left",
                    marginLeft: 3,
                  }}
                >
                  ทั้งหมด : {list.length} รายการ{" "}
                </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className=" bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          รวมเงิน :
                        </div>
                        <div
                          className=" bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {list
                            .map((num) => num)
                            .reduce((acc, curr) => acc + curr.total, 0)}
                        </div>
                        <div
                          className=" bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          ส่วนลดท้ายบิล :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {Number(alldatalist.discount) +
                            Number(alldatalist.promotion)}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          ใช้แต้มส่วนลด :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {parseInt(String(alldatalist.usereward))}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      {String(taxNum) === "" ? (
                        ""
                      ) : (
                        <div>
                          <div
                            className="d-flex bd-highlight"
                            style={{ justifySelf: "end" }}
                          >
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "right",
                                width: 200,
                                height: 20,
                              }}
                            >
                              จำนวนเงินรวมทั้งสิ้น :
                            </div>
                            <div
                              className="bd-highlight ml-1 mr-1"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "center",
                                width: 70,
                                height: 20,
                              }}
                            >
                              {Number(
                                list
                                  .map((num) => num)
                                  .reduce((acc, curr) => acc + curr.total, 0),
                              ) -
                                Number(alldatalist.discount) -
                                Number(alldatalist.promotion) -
                                Number(parseInt(alldatalist.usereward))}
                            </div>
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "left",
                                width: 20,
                                height: 20,
                              }}
                            >
                              บาท
                            </div>
                          </div>
                          <div
                            className="row"
                            style={{
                              justifySelf: "right",
                              width: "32%",
                              height: 1,
                              backgroundColor: "black",
                            }}
                          ></div>
                          <div
                            className="d-flex bd-highlight"
                            style={{ justifySelf: "end" }}
                          >
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "right",
                                width: 200,
                                height: 20,
                              }}
                            >
                              หักภาษี ณ ที่จ่าย {String(taxNum)} % :
                            </div>
                            <div
                              className="bd-highlight ml-1 mr-1"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "center",
                                width: 70,
                                height: 20,
                              }}
                            >
                              {(
                                ((Number(
                                  list
                                    .map((num) => num)
                                    .reduce((acc, curr) => acc + curr.total, 0),
                                ) -
                                  Number(alldatalist.discount) -
                                  Number(alldatalist.promotion) -
                                  Number(parseInt(alldatalist.usereward))) *
                                  Number(taxNum)) /
                                100
                              ).toFixed(1)}
                            </div>
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "left",
                                width: 20,
                                height: 20,
                              }}
                            >
                              บาท
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 30,
                          }}
                        >
                          ยอดชำระทั้งหมด :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 30,
                          }}
                        >
                          {(
                            Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) -
                            Number(alldatalist.discount) -
                            Number(alldatalist.promotion) -
                            Number(parseInt(alldatalist.usereward)) +
                            ((Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) -
                              Number(alldatalist.discount) -
                              Number(alldatalist.promotion) -
                              Number(parseInt(alldatalist.usereward))) *
                              Number(taxNum)) /
                            100
                          ).toFixed(1)}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 30,
                          }}
                        >
                          บาท
                        </div>
                      </div>
                      <div
                        className="row"
                        style={{
                          justifySelf: "right",
                          width: "32%",
                          height: 1,
                          backgroundColor: "black",
                        }}
                      ></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  ">
                        <div
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "Kanit",
                            fontSize: 11,
                            height: 60,
                          }}
                        >
                          ในนาม {name_cus}
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          .......................................................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ผู้สั่งซื้อสินค้า
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ........../............/.....................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          วันที่
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="col-sm-1"
                    style={{ justifyItems: "center" }}
                  ></div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  ">
                        <div
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "Kanit",
                            fontSize: 11,
                            height: 60,
                          }}
                        >
                          ในนาม {storeS}
                        </div>
                      </div>

                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ......................................................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ผู้อนุมัติ
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ........./.........../....................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          วันที่
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={reactToPrintFn2}
            >
              Print
            </button>

            <button
              className="btn btn-success"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={handleClick}
            >
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={() => setShowW(false)}
            >
              ปิด
            </button>
          </Modal_qa.Footer>
        </Modal_qa>
      </>
    );
  }

  // input ใบแจ้งหนี้
  function InvoiceTemplate() {
    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);

    // Post Quatation
    const CreateBill = async () => {
      let companyS = localStorage.getItem("company_") || "";

      const companyall = companyS;
      const id_costomer = Number(alldatalist.id_costomer);
      const code_costomer = alldatalist.code_costomer;
      const name_costomer = String(name_cus);
      const group_price = alldatalist.group_price;
      const pay =
        alldatalist.pay === "cash"
          ? "เงินสด"
          : alldatalist.pay === "payment"
            ? "โอน"
            : "";
      const bill = Number(alldatalist.bill);
      const totalall = Number(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ),
      );
      const discount =
        Number(alldatalist.discount) + Number(alldatalist.promotion);
      const sumtotal = Number(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ) -
        Number(alldatalist.discount) -
        Number(parseInt(alldatalist.usereward)),
      );
      const addreward = Number(alldatalist.addreward);
      const usereward = Number(alldatalist.usereward);
      const taxnumber =
        String(localStorage.getItem("numbertax_S") || "") === String("notax")
          ? ""
          : String(localStorage.getItem("numbertax_S") || "") ===
            String("three")
            ? "3"
            : String(localStorage.getItem("numbertax_S") || "") ===
              String("seven")
              ? "7"
              : "";
      const personall = String(localStorage.getItem("person_") || "");
      const statussall = alldatalist.statuss;
      const inv_date = new Date(startDate);
      const inv_enddate = new Date(startDate1);
      const inv_credit = Number(daysDiff);
      const inv_number = Number(maxRecNI);
      const inv_orderNo = year + month + day;
      const inv_orderfull = "INV" + year + month + day + Number(maxRecNI);
      const inv_status = "รออนุมัติ";
      const inv_person = "";
      const inv_remark = "";
      const detailsale = list.map((posts) => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }));

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`, {
          companyall,
          id_costomer,
          code_costomer,
          name_costomer,
          group_price,
          pay,
          bill,
          totalall,
          discount,
          sumtotal,
          addreward,
          usereward,
          personall,
          statussall,
          taxnumber,
          inv_date,
          inv_number,
          inv_orderNo,
          inv_status,
          inv_person,
          inv_remark,
          inv_enddate,
          inv_credit,
          inv_orderfull,

          detailsale,
        });
      } catch (error) {
        console.error(error);
      }
    };

    const handleClick = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill();
      await fetchQT();
      setShowW(false);

      seachNames();

      setTimeout(() => {
        (deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2"));
        setatalist(initialValues4);
        setMessage("");
      }, 30);

      setLoading(false);
    };

    let taxNum =
      String(localStorage.getItem("numbertax_S") || "") === String("notax")
        ? ""
        : String(localStorage.getItem("numbertax_S") || "") === String("three")
          ? "3"
          : String(localStorage.getItem("numbertax_S") || "") ===
            String("seven")
            ? "7"
            : "";

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState("notax");

    const Radio_tax = () => {
      useEffect(() => {
        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "");
        // fetchQT()
        maxVI();
      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {
        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value);
      };
      return (
        <>
          <div className="col">
            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === "notax"} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === "three"} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === "seven"}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
              />
              หักภาษี 7 %
            </label>
          </div>
        </>
      );
    };

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return (
      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>
              ไม่สามารถ สร้างใบแจข้งหนี้ได้ !
            </Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <button
                style={{ fontSize: 14, fontFamily: "Kanit" }}
                onClick={() => setShow(false)}
                className="outline-success"
              >
                ปิด
              </button>
            </div>
          </Alert>

          {!show && (
            <button
              disabled={list.length < 1 ? true : false}
              onClick={() => {
                (name_cus === "" ? setShow(true) : setShowW(true), maxVI());
              }}
              type="button"
              className="btn btn-outline-secondary"
              style={{
                width: 110,
                height: 30,
                fontSize: 12,
                marginLeft: 10,
                marginTop: 5,
                fontFamily: "Kanit",
              }}
            >
              สร้างใบแจ้งหนี้
            </button>
          )}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div
                style={{
                  width: "auto",
                  height: 20,
                  fontSize: 13,
                  fontFamily: "Kanit",
                }}
              >
                สร้างใบแจ้งหนี้
              </div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>
            <div
              className="col  "
              style={{
                justifySelf: "center",
                backgroundColor: "white",
                marginLeft: 20,
                marginRight: 20,
              }}
              ref={contentRef}
            >
              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>
                <div className="col ">
                  {/**ผูขาย */}
                  <div
                    className="row mt-4"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    ผู้ขาย
                  </div>
                  <div
                    className="row  "
                    style={{
                      textAlign: "left",
                      fontFamily: "Kanit_B",
                      fontSize: 11,
                    }}
                  >
                    {storeS}
                  </div>
                  <div
                    className="row"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    {addressS}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    เลขที่ผู้เสียภาษี :{taxS}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    โทร : {telS}
                  </div>

                  {/**ผู้ซื้อ */}
                  <div
                    className="row mt-2"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    ผู้ชื้อ
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "Kanit_B",
                      fontSize: 11,
                    }}
                  >
                    {name_cus}
                  </div>
                  <div
                    className="row"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    {address_cus}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    เลขที่ผู้เสียภาษี :{numbertax_cus}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    โทร : {tel_cus}
                  </div>
                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div
                    className="row "
                    style={{
                      textAlign: "center",
                      fontFamily: "Kanit",
                      fontSize: 20,
                      justifySelf: "center",
                    }}
                  >
                    ใบแจ้งหนี้
                  </div>
                  <div
                    className="mt-1 mb-2"
                    style={{
                      justifySelf: "center",
                      width: "70%",
                      height: 1,
                      backgroundColor: "black",
                    }}
                  ></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        เลขที่ :
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        วันที่ :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        เครดิต :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        วันครบกำหนด :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        ผู้ขาย :
                      </div>
                    </div>
                    <div className="col ">
                      <div
                        className="col "
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        INV{year}
                        {month}
                        {day}
                        {maxRecNI}
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        {/**Open */}
                        <div
                          className="border border-black shadow shadow-sm rounded "
                          style={{ width: 130, height: 25 }}
                        >
                          <div
                            style={{ width: 100, marginLeft: 10, marginTop: 2 }}
                          >
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString(
                                "es-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                              //  selected={startDate}
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        {daysDiff} วัน
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        <div
                          className="border border-black shadow shadow-sm rounded "
                          style={{ width: 130, height: 25 }}
                        >
                          <div
                            style={{ width: 100, marginLeft: 10, marginTop: 2 }}
                          >
                            <DatePicker
                              value={new Date(startDate1).toLocaleDateString(
                                "es-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                              //selected={startDate1}
                              onChange={(date: any) => setStartDate1(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-2 mb-2"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        ชื่อผู้ขาย
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-1 mb-2"
                    style={{
                      justifySelf: "center",
                      width: "70%",
                      height: 1,
                      backgroundColor: "black",
                    }}
                  ></div>
                </div>
              </div>

              <div
                className="row mt-3"
                style={{ marginLeft: 20, marginRight: 20 }}
              >
                <div
                  className="d-flex bd-highlight"
                  style={{ justifySelf: "right" }}
                >
                  <div
                    className=" flex-grow-1 bd-highlight"
                    style={{
                      fontFamily: "kanit_B",
                      fontSize: 11,
                      textAlign: "start",
                      height: 15,
                      width: "5vw",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    รายการ
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 45,
                    }}
                  >
                    จำนวน
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    หน่วย
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 70,
                    }}
                  >
                    ราคาต่อหน่วย
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    ลด/ชิ้น
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    รวม
                  </div>
                </div>
                <div
                  className="mt-1 "
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    height: 1,
                    backgroundColor: "black",
                  }}
                ></div>
                <table className="table">
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.map((a: any) => (
                          <div key={a.id} id="selcet-print">
                            <div
                              className="d-flex bd-highlight"
                              style={{ justifyItems: "end" }}
                            >
                              <div
                                className=" flex-grow-1 bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "start",
                                  height: 23,
                                  width: "5vw",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {a.name_product}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "center",
                                  height: 23,
                                  width: 30,
                                }}
                              >
                                {a.qty}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                }}
                              >
                                {a.unit}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 70,
                                }}
                              >
                                {a.price}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                }}
                              >
                                {a.discount}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                  marginRight: 5,
                                }}
                              >
                                {a.total}
                              </div>
                            </div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div
                  className=" "
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    height: 1,
                    backgroundColor: "black",
                  }}
                ></div>
                <div
                  className="row "
                  style={{
                    fontFamily: "kanit",
                    fontSize: 11,
                    justifySelf: "left",
                    marginLeft: 3,
                  }}
                >
                  ทั้งหมด : {list.length} รายการ{" "}
                </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className=" bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          รวมเงิน :
                        </div>
                        <div
                          className=" bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {list
                            .map((num) => num)
                            .reduce((acc, curr) => acc + curr.total, 0)}
                        </div>
                        <div
                          className=" bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          ส่วนลดท้ายบิล :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {Number(alldatalist.discount) +
                            Number(alldatalist.promotion)}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          ใช้แต้มส่วนลด :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {parseInt(String(alldatalist.usereward))}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      {String(taxNum) === "" ? (
                        ""
                      ) : (
                        <div>
                          <div
                            className="d-flex bd-highlight"
                            style={{ justifySelf: "end" }}
                          >
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "right",
                                width: 200,
                                height: 20,
                              }}
                            >
                              จำนวนเงินรวมทั้งสิ้น :
                            </div>
                            <div
                              className="bd-highlight ml-1 mr-1"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "center",
                                width: 70,
                                height: 20,
                              }}
                            >
                              {Number(
                                list
                                  .map((num) => num)
                                  .reduce((acc, curr) => acc + curr.total, 0),
                              ) -
                                Number(alldatalist.discount) -
                                Number(alldatalist.promotion) -
                                Number(parseInt(alldatalist.usereward))}
                            </div>
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "left",
                                width: 20,
                                height: 20,
                              }}
                            >
                              บาท
                            </div>
                          </div>
                          <div
                            className="row"
                            style={{
                              justifySelf: "right",
                              width: "32%",
                              height: 1,
                              backgroundColor: "black",
                            }}
                          ></div>
                          <div
                            className="d-flex bd-highlight"
                            style={{ justifySelf: "end" }}
                          >
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "right",
                                width: 200,
                                height: 20,
                              }}
                            >
                              หักภาษี ณ ที่จ่าย {String(taxNum)} % :
                            </div>
                            <div
                              className="bd-highlight ml-1 mr-1"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "center",
                                width: 70,
                                height: 20,
                              }}
                            >
                              {(
                                ((Number(
                                  list
                                    .map((num) => num)
                                    .reduce((acc, curr) => acc + curr.total, 0),
                                ) -
                                  Number(alldatalist.discount) -
                                  Number(alldatalist.promotion) -
                                  Number(parseInt(alldatalist.usereward))) *
                                  Number(taxNum)) /
                                100
                              ).toFixed(1)}
                            </div>
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "left",
                                width: 20,
                                height: 20,
                              }}
                            >
                              บาท
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 30,
                          }}
                        >
                          ยอดชำระทั้งหมด :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 30,
                          }}
                        >
                          {(
                            Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) -
                            Number(alldatalist.discount) -
                            Number(alldatalist.promotion) -
                            Number(parseInt(alldatalist.usereward)) +
                            ((Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) -
                              Number(alldatalist.discount) -
                              Number(alldatalist.promotion) -
                              Number(parseInt(alldatalist.usereward))) *
                              Number(taxNum)) /
                            100
                          ).toFixed(1)}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 30,
                          }}
                        >
                          บาท
                        </div>
                      </div>
                      <div
                        className="row"
                        style={{
                          justifySelf: "right",
                          width: "32%",
                          height: 1,
                          backgroundColor: "black",
                        }}
                      ></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  ">
                        <div
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "Kanit",
                            fontSize: 11,
                            height: 60,
                          }}
                        >
                          ในนาม {name_cus}
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          .......................................................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ผู้สั่งซื้อสินค้า
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ........../............/.....................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          วันที่
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="col-sm-1"
                    style={{ justifyItems: "center" }}
                  ></div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  ">
                        <div
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "Kanit",
                            fontSize: 11,
                            height: 60,
                          }}
                        >
                          ในนาม {storeS}
                        </div>
                      </div>

                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ......................................................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ผู้อนุมัติ
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ........./.........../....................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          วันที่
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={reactToPrintFn2}
            >
              Print
            </button>

            <button
              className="btn btn-success"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={handleClick}
            >
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={() => setShowW(false)}
            >
              ปิด
            </button>
          </Modal_qa.Footer>
        </Modal_qa>
      </>
    );
  }

  // input ใบเสร็จรับเงิน
  function ReTemplate() {
    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);

    // Post Quatation
    const CreateBill = async () => {
      let companyS = localStorage.getItem("company_") || "";

      const companyall = companyS;
      const id_costomer = Number(alldatalist.id_costomer);
      const code_costomer = alldatalist.code_costomer;
      const name_costomer = String(name_cus);
      const group_price = alldatalist.group_price;
      const pay =
        alldatalist.pay === "cash"
          ? "เงินสด"
          : alldatalist.pay === "payment"
            ? "โอน"
            : "";
      const bill = Number(alldatalist.bill);
      const totalall = Number(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ),
      );
      const discount =
        Number(alldatalist.discount) + Number(alldatalist.promotion);
      const sumtotal = Number(
        Number(
          list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0),
        ) -
        Number(alldatalist.discount) -
        Number(parseInt(alldatalist.usereward)),
      );
      const addreward = Number(alldatalist.addreward);
      const usereward = Number(alldatalist.usereward);
      const taxnumber =
        String(localStorage.getItem("numbertax_S") || "") === String("notax")
          ? ""
          : String(localStorage.getItem("numbertax_S") || "") ===
            String("three")
            ? "3"
            : String(localStorage.getItem("numbertax_S") || "") ===
              String("seven")
              ? "7"
              : "";
      const personall = String(localStorage.getItem("person_") || "");
      const statussall = alldatalist.statuss;
      const re_date = new Date(startDate);
      const re_enddate = new Date(startDate1);
      const re_credit = Number(daysDiff);
      const re_number = Number(maxRecNR);
      const re_orderNo = year + month + day;
      const re_orderfull = "RE" + year + month + day + Number(maxRecNR);
      const re_status = "รออนุมัติ";
      const re_person = String(localStorage.getItem("person_") || "");
      const re_remark = "";
      const detailsale = list.map((posts) => ({
        company: posts.company,
        id_product: Number(posts.id_product),
        code_product: posts.code_product,
        name_product: posts.name_product,
        cetagory: posts.cetagory,
        unit: posts.unit,
        cost: Number(posts.cost),
        qty: Number(posts.qty),
        price: Number(posts.price),
        discount: Number(posts.discount),
        total: Number(posts.total),
        person: String(localStorage.getItem("person_") || ""),
        statuss: posts.statuss,
      }));

      try {
        //   localStorage.setItem("show","1")
        //Save Sale
        await axios.post(`/api/${apiquatation}`, {
          companyall,
          id_costomer,
          code_costomer,
          name_costomer,
          group_price,
          pay,
          bill,
          totalall,
          discount,
          sumtotal,
          addreward,
          usereward,
          personall,
          statussall,
          taxnumber,
          re_date,
          re_number,
          re_orderNo,
          re_status,
          re_person,
          re_remark,
          re_enddate,
          re_credit,
          re_orderfull,

          detailsale,
        });
      } catch (error) {
        console.error(error);
      }
    };

    const handleClick = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 2000));

      //  SaleMainSubmit(),
      //    setMessage("")
      await CreateBill();
      await fetchQT();
      setShowW(false);

      seachNames();

      setTimeout(() => {
        (deleteall(),
          localStorage.setItem("itemlist", String(list.length)),
          setchangePay("2"));
        setatalist(initialValues4);
        setMessage("");
      }, 30);

      setLoading(false);
    };

    let taxNum =
      String(localStorage.getItem("numbertax_S") || "") === String("notax")
        ? ""
        : String(localStorage.getItem("numbertax_S") || "") === String("three")
          ? "3"
          : String(localStorage.getItem("numbertax_S") || "") ===
            String("seven")
            ? "7"
            : "";

    const [showW, setShowW] = useState(false);

    // Alert
    const [show, setShow] = useState(false);

    //Print Label
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn2 = useReactToPrint({ contentRef });

    // input Radio Tax
    const [selectedOptiontax, setSelectedOptiontax] = useState("notax");

    const Radio_tax = () => {
      useEffect(() => {
        setSelectedOptiontax(localStorage.getItem("numbertax_S") || "");
        // fetchQT()
        maxVR();
      }, [Number(selectedOptiontax)]);

      const handleOptionChange4 = (e: any) => {
        const { name, value } = e.target;
        setSelectedOptiontax(e.target.value);
        localStorage.setItem("numbertax_S", e.target.value);
      };
      return (
        <>
          <div className="col">
            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="notax" // Same name for all radio buttons in the group
                value="notax"
                checked={selectedOptiontax === "notax"} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              ไม่หักภาษี
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="three" // Same name for all radio buttons in the group
                value="three"
                checked={selectedOptiontax === "three"} // Controlled by state
                onChange={handleOptionChange4}
                style={{ marginRight: 10, fontFamily: "Kanit" }}
              />
              หักภาษี 3 %
            </label>

            <label style={{ fontFamily: "Kanit", fontSize: 15, marginLeft: 5 }}>
              <input
                type="radio"
                name="seven"
                value="seven"
                checked={selectedOptiontax === "seven"}
                onChange={handleOptionChange4}
                style={{ marginLeft: 20, marginRight: 10, fontFamily: "Kanit" }}
              />
              หักภาษี 7 %
            </label>
          </div>
        </>
      );
    };

    //***Order Date Diff */
    const [startDate, setStartDate] = useState(new Date());
    const [startDate1, setStartDate1] = useState(new Date());

    let date1 = new Date(startDate);
    let date2 = new Date(startDate1);

    // Convert dates to UTC timestamps
    let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // Calculate the time difference in milliseconds
    let timeDiff = Math.abs(utc2 - utc1);

    // Convert milliseconds to days
    let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return (
      <>
        <>
          <Alert show={show} variant="warning" style={{ margin: 5 }}>
            <Alert.Heading style={{ fontSize: 13, fontFamily: "Kanit" }}>
              ไม่สามารถ สร้างใบแจข้งหนี้ได้ !
            </Alert.Heading>
            <hr />
            <p style={{ fontSize: 14, fontFamily: "Kanit" }}>
              กรุณาคลิก "กลับ (F10)" และ กรอก "ข้อมูลลูกค้า" ให้ครบถ้วนค่ะ
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <button
                style={{ fontSize: 14, fontFamily: "Kanit" }}
                onClick={() => setShow(false)}
                className="outline-success"
              >
                ปิด
              </button>
            </div>
          </Alert>

          {!show && (
            <button
              disabled={list.length < 1 ? true : false}
              onClick={() => {
                (name_cus === "" ? setShow(true) : setShowW(true), maxVR());
              }}
              type="button"
              className="btn btn-outline-secondary"
              style={{
                width: 120,
                height: 30,
                fontSize: 12,
                marginLeft: 10,
                marginTop: 5,
                fontFamily: "Kanit",
              }}
            >
              สร้างใบเสร็จรับเงิน
            </button>
          )}
        </>

        <Modal_qa
          show={showW}
          onHide={() => setShowW(false)}
          size="lg"
          scrollable={true}
          //  fullscreen={true}
          //  dialogClassName="80w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal_qa.Header closeButton>
            <Modal_qa.Title id="example-custom-modal-styling-title">
              <div
                style={{
                  width: "auto",
                  height: 20,
                  fontSize: 13,
                  fontFamily: "Kanit",
                }}
              >
                สร้างใบเสร็จรับเงิน
              </div>
            </Modal_qa.Title>
          </Modal_qa.Header>
          <Modal_qa.Body style={{ backgroundColor: "grey" }}>
            <div
              className="col  "
              style={{
                justifySelf: "center",
                backgroundColor: "white",
                marginLeft: 20,
                marginRight: 20,
              }}
              ref={contentRef}
            >
              <div className="row" style={{ height: 60 }}></div>
              <div className="row" style={{ marginLeft: 20 }}>
                <div className="col ">
                  {/**ผูขาย */}
                  <div
                    className="row mt-4"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    ผู้ขาย
                  </div>
                  <div
                    className="row  "
                    style={{
                      textAlign: "left",
                      fontFamily: "Kanit_B",
                      fontSize: 11,
                    }}
                  >
                    {storeS}
                  </div>
                  <div
                    className="row"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    {addressS}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    เลขที่ผู้เสียภาษี :{taxS}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    โทร : {telS}
                  </div>

                  {/**ผู้ซื้อ */}
                  <div
                    className="row mt-2"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    ผู้ชื้อ
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "Kanit_B",
                      fontSize: 11,
                    }}
                  >
                    {name_cus}
                  </div>
                  <div
                    className="row"
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    {address_cus}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    เลขที่ผู้เสียภาษี :{numbertax_cus}
                  </div>
                  <div
                    className="row "
                    style={{
                      textAlign: "left",
                      fontFamily: "kanit",
                      fontSize: 11,
                    }}
                  >
                    โทร : {tel_cus}
                  </div>
                </div>

                {/**ใบเสนราคา */}
                <div className="col ">
                  <div
                    className="row "
                    style={{
                      textAlign: "center",
                      fontFamily: "Kanit",
                      fontSize: 20,
                      justifySelf: "center",
                    }}
                  >
                    ใบเสร็จรับเงิน
                  </div>
                  <div
                    className="mt-1 mb-2"
                    style={{
                      justifySelf: "center",
                      width: "70%",
                      height: 1,
                      backgroundColor: "black",
                    }}
                  ></div>

                  {/**** */}
                  <div className="row">
                    <div className="col-4 ">
                      <div
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        เลขที่ :
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        วันที่ :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        เครดิต :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        วันครบกำหนด :
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          textAlign: "right",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        ผู้ขาย :
                      </div>
                    </div>
                    <div className="col ">
                      <div
                        className="col "
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        RE{year}
                        {month}
                        {day}
                        {maxRecNI}
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        {/**Open */}
                        <div
                          className="border border-black shadow shadow-sm rounded "
                          style={{ width: 130, height: 25 }}
                        >
                          <div
                            style={{ width: 100, marginLeft: 10, marginTop: 2 }}
                          >
                            <DatePicker
                              value={new Date(startDate).toLocaleDateString(
                                "es-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                              //  selected={startDate}
                              onChange={(date: any) => setStartDate(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        {daysDiff} วัน
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        <div
                          className="border border-black shadow shadow-sm rounded "
                          style={{ width: 130, height: 25 }}
                        >
                          <div
                            style={{ width: 100, marginLeft: 10, marginTop: 2 }}
                          >
                            <DatePicker
                              value={new Date(startDate1).toLocaleDateString(
                                "es-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                              //selected={startDate1}
                              onChange={(date: any) => setStartDate1(date)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="mt-2 mb-2"
                        style={{
                          textAlign: "left",
                          fontFamily: "kanit",
                          fontSize: 13,
                        }}
                      >
                        ชื่อผู้ขาย
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-1 mb-2"
                    style={{
                      justifySelf: "center",
                      width: "70%",
                      height: 1,
                      backgroundColor: "black",
                    }}
                  ></div>
                </div>
              </div>

              <div
                className="row mt-3"
                style={{ marginLeft: 20, marginRight: 20 }}
              >
                <div
                  className="d-flex bd-highlight"
                  style={{ justifySelf: "right" }}
                >
                  <div
                    className=" flex-grow-1 bd-highlight"
                    style={{
                      fontFamily: "kanit_B",
                      fontSize: 11,
                      textAlign: "start",
                      height: 15,
                      width: "5vw",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    รายการ
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 45,
                    }}
                  >
                    จำนวน
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    หน่วย
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 70,
                    }}
                  >
                    ราคาต่อหน่วย
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    ลด/ชิ้น
                  </div>
                  <div
                    className=" bd-highlight"
                    style={{
                      fontFamily: "kanit",
                      fontSize: 10,
                      textAlign: "end",
                      height: 15,
                      width: 50,
                    }}
                  >
                    รวม
                  </div>
                </div>
                <div
                  className="mt-1 "
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    height: 1,
                    backgroundColor: "black",
                  }}
                ></div>
                <table className="table">
                  <tbody className="">
                    <tr className="">
                      <td className="">
                        {list.map((a: any) => (
                          <div key={a.id} id="selcet-print">
                            <div
                              className="d-flex bd-highlight"
                              style={{ justifyItems: "end" }}
                            >
                              <div
                                className=" flex-grow-1 bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "start",
                                  height: 23,
                                  width: "5vw",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {a.name_product}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "center",
                                  height: 23,
                                  width: 30,
                                }}
                              >
                                {a.qty}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                }}
                              >
                                {a.unit}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 70,
                                }}
                              >
                                {a.price}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                }}
                              >
                                {a.discount}
                              </div>
                              <div
                                className=" bd-highlight"
                                style={{
                                  fontFamily: "kanit",
                                  fontSize: 11,
                                  textAlign: "end",
                                  height: 23,
                                  width: 50,
                                  marginRight: 5,
                                }}
                              >
                                {a.total}
                              </div>
                            </div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div
                  className=" "
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    height: 1,
                    backgroundColor: "black",
                  }}
                ></div>
                <div
                  className="row "
                  style={{
                    fontFamily: "kanit",
                    fontSize: 11,
                    justifySelf: "left",
                    marginLeft: 3,
                  }}
                >
                  ทั้งหมด : {list.length} รายการ{" "}
                </div>

                {/**ท้ายบิล Slip */}
                <div className="container">
                  <div className="row ">
                    <div className="col ">
                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className=" bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          รวมเงิน :
                        </div>
                        <div
                          className=" bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {list
                            .map((num) => num)
                            .reduce((acc, curr) => acc + curr.total, 0)}
                        </div>
                        <div
                          className=" bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          ส่วนลดท้ายบิล :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {Number(alldatalist.discount) +
                            Number(alldatalist.promotion)}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 20,
                          }}
                        >
                          ใช้แต้มส่วนลด :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 20,
                          }}
                        >
                          {parseInt(String(alldatalist.usereward))}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 20,
                          }}
                        >
                          บาท
                        </div>
                      </div>

                      {String(taxNum) === "" ? (
                        ""
                      ) : (
                        <div>
                          <div
                            className="d-flex bd-highlight"
                            style={{ justifySelf: "end" }}
                          >
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "right",
                                width: 200,
                                height: 20,
                              }}
                            >
                              จำนวนเงินรวมทั้งสิ้น :
                            </div>
                            <div
                              className="bd-highlight ml-1 mr-1"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "center",
                                width: 70,
                                height: 20,
                              }}
                            >
                              {Number(
                                list
                                  .map((num) => num)
                                  .reduce((acc, curr) => acc + curr.total, 0),
                              ) -
                                Number(alldatalist.discount) -
                                Number(alldatalist.promotion) -
                                Number(parseInt(alldatalist.usereward))}
                            </div>
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "left",
                                width: 20,
                                height: 20,
                              }}
                            >
                              บาท
                            </div>
                          </div>
                          <div
                            className="row"
                            style={{
                              justifySelf: "right",
                              width: "32%",
                              height: 1,
                              backgroundColor: "black",
                            }}
                          ></div>
                          <div
                            className="d-flex bd-highlight"
                            style={{ justifySelf: "end" }}
                          >
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "right",
                                width: 200,
                                height: 20,
                              }}
                            >
                              หักภาษี ณ ที่จ่าย {String(taxNum)} % :
                            </div>
                            <div
                              className="bd-highlight ml-1 mr-1"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "center",
                                width: 70,
                                height: 20,
                              }}
                            >
                              {(
                                ((Number(
                                  list
                                    .map((num) => num)
                                    .reduce((acc, curr) => acc + curr.total, 0),
                                ) -
                                  Number(alldatalist.discount) -
                                  Number(alldatalist.promotion) -
                                  Number(parseInt(alldatalist.usereward))) *
                                  Number(taxNum)) /
                                100
                              ).toFixed(1)}
                            </div>
                            <div
                              className="bd-highlight"
                              style={{
                                fontFamily: "kanit",
                                fontSize: 11,
                                textAlign: "left",
                                width: 20,
                                height: 20,
                              }}
                            >
                              บาท
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        className="d-flex bd-highlight"
                        style={{ justifySelf: "end" }}
                      >
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "right",
                            width: 200,
                            height: 30,
                          }}
                        >
                          ยอดชำระทั้งหมด :
                        </div>
                        <div
                          className="bd-highlight ml-1 mr-1"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "center",
                            width: 70,
                            height: 30,
                          }}
                        >
                          {(
                            Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) -
                            Number(alldatalist.discount) -
                            Number(alldatalist.promotion) -
                            Number(parseInt(alldatalist.usereward)) +
                            ((Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) -
                              Number(alldatalist.discount) -
                              Number(alldatalist.promotion) -
                              Number(parseInt(alldatalist.usereward))) *
                              Number(taxNum)) /
                            100
                          ).toFixed(1)}
                        </div>
                        <div
                          className="bd-highlight"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "left",
                            width: 20,
                            height: 30,
                          }}
                        >
                          บาท
                        </div>
                      </div>
                      <div
                        className="row"
                        style={{
                          justifySelf: "right",
                          width: "32%",
                          height: 1,
                          backgroundColor: "black",
                        }}
                      ></div>
                    </div>
                    <div className="h-5"></div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  ">
                        <div
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "Kanit",
                            fontSize: 11,
                            height: 60,
                          }}
                        >
                          ในนาม {name_cus}
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          .......................................................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ผู้สั่งซื้อสินค้า
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ........../............/.....................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          วันที่
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="col-sm-1"
                    style={{ justifyItems: "center" }}
                  ></div>

                  <div className="col-5" style={{ justifyItems: "center" }}>
                    <div className="row">
                      <div className="row  ">
                        <div
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "Kanit",
                            fontSize: 11,
                            height: 60,
                          }}
                        >
                          ในนาม {storeS}
                        </div>
                      </div>

                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ......................................................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ผู้อนุมัติ
                        </div>
                      </div>
                      <div className="col">
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          ........./.........../....................
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            fontFamily: "kanit",
                            fontSize: 10,
                          }}
                        >
                          วันที่
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal_qa.Body>
          <Modal_qa.Footer>
            <Radio_tax />
            <button
              className="btn btn-primary"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={reactToPrintFn2}
            >
              Print
            </button>

            <button
              className="btn btn-success"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={handleClick}
            >
              {loading ? (
                <>
                  <SpinnerIcon size={9} color="text-white" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: 80,
                height: 35,
                fontSize: 15,
                fontFamily: "Kanit",
              }}
              onClick={() => setShowW(false)}
            >
              ปิด
            </button>
          </Modal_qa.Footer>
        </Modal_qa>
      </>
    );
  }

  // Before Sale
  function Beforepay() {
    //*********Loading*********************** */
    const [loading1, setLoading1] = useState(true);
    const [loading, setLoading] = useState(false);

    // Modal state สำหรับเพิ่มชื่อลูกค้า สั่งซื้อยา ข.ย.10-13
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerNameInput, setCustomerNameInput] = useState("");
    const [itemsNeedCustomer, setItemsNeedCustomer] = useState<Task[]>([]);

    const proceedPayment = async () => {
      if (loading) return;
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));
      (setatalist({
        ...alldatalist,
        discount: "0",
        usereward: "0",
        receivebaht: "",
        bill: String(list.filter((item) => item.qty > 0).length),
        code_costomer: code_cus,
        names: name_cus,
        id_costomer: id_cus,
        group_price: localStorage.getItem("countrow") || "",
        pay: "cash",
        totalPoint: String(totalPont),
        id_main: String(Date.now()),
        promotion: String(SumPro),
      }),
        setchangePay("1"),
        localStorage.setItem("showhead", "0"),
        localStorage.setItem("pay_s", "cash"),
        setSelectedOption("cash"));
      setMessage("0");
      fetchQT();

      // Focus on receive input after state transition
      setTimeout(() => {
        receiveInputRef.current?.focus();
      }, 100);

      setLoading(false);
    };

    const getDrugLabel = (code_product: string): string | null => {
      const drugTypes = [
        "ขย.10",
        "ขย.11",
        "ขย.12",
        "ขย.13",
        "ข.ย.10",
        "ข.ย.11",
        "ข.ย.12",
        "ข.ย.13",
        "ขย.10 และ ขย.11",
        "ขย.10 และ ขย.12",
        "ขย.11 และ ขย.12",
      ];
      const prod = dataProduct.find((p: any) => p.code === code_product);
      if (!prod) return null;
      const matchType = drugTypes.includes(prod.type) ? prod.type : null;
      const matchSubtype = drugTypes.includes(prod.subtype)
        ? prod.subtype
        : null;
      return matchType || matchSubtype;
    };

    const handleClick = async () => {
      // ตรวจสอบสินค้าที่มี matchType || matchSubtype ตรงกับ ขย.10-13, ข.ย.10-13
      const itemsWithDrugType = list.filter(
        (item) => getDrugLabel(item.code_product) !== null,
      );

      if (itemsWithDrugType.length > 0) {
        // มีสินค้าประเภทยา ข.ย. → ตรวจสอบชื่อลูกค้า
        if (name_cus && name_cus.trim() !== "") {
          // มีชื่อลูกค้าแล้ว → เก็บ type และ name_customer ให้ตรงแถว แล้วดำเนินการต่อ
          setList(
            list.map((task) => {
              const label = getDrugLabel(task.code_product);
              return label
                ? { ...task, type: label, name_customer: name_cus }
                : task;
            }),
          );
          await proceedPayment();
        } else {
          // ไม่มีชื่อลูกค้า → แสดง modal
          setItemsNeedCustomer(itemsWithDrugType);
          setCustomerNameInput("");
          setShowCustomerModal(true);
        }
      } else {
        // ไม่มีสินค้าประเภทยา → ดำเนินการปกติ
        await proceedPayment();
      }
    };

    const handleConfirmCustomerModal = async () => {
      if (customerNameInput.trim() === "") return;
      // เก็บ type และ name_customer ให้ตรงแถว
      setList(
        list.map((task) => {
          const label = getDrugLabel(task.code_product);
          return label
            ? { ...task, type: label, name_customer: customerNameInput.trim() }
            : task;
        }),
      );
      setShowCustomerModal(false);
      await proceedPayment();
    };

    const handleSave = () => (list.length > 0 ? handleClick() : "");

    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        // Check if focus is on an input or textarea
        const target = event.target as HTMLElement;
        const isInputFocused =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA";

        switch (key) {
          case "f12":
            event.preventDefault();
            handleSave();
            break;
          case "enter":
            // Only trigger if not focused on input/textarea (same conditions as mouse click)
            if (!isInputFocused) {
              event.preventDefault();
              handleSave();
            }
            break;
        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener("keydown", handleKeyDown as EventListener);

      return () => {
        window.removeEventListener("keydown", handleKeyDown as EventListener);
      };
    }, [handleSave /*, handlePrint, handleClear*/]);
    //****************************************** */

    const [drugs, setdrugs] = useState([]);

    useEffect(() => {
      setTimeout(() => {
        setdrugs(JSON.parse(localStorage.getItem("dg") || "[]"));
      }, 1000);

      //setdrugs(JSON.parse(localStorage.getItem("dg")||""))
    }, [id_cus]);

    /*
            const GetDrug = async () => {
               let companyS= (localStorage.getItem("company_") || "")
                try {
                  const res = await axios.get(`/api/${getdrugg}?company=${companyS}&id_cus=${Number(id_cus)}`)
                  
                    
                  id_cus!==undefined?  setdrugs(res.data):""
                  localStorage.setItem("dg",JSON.stringify(res.data))
             
                } catch (error) {
                  console.error(error)
                }
               
              }  

*/

    const [l, setlevel] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("level_data") || "[]");
      } catch {
        return [];
      }
    });

    // การมองเห็น - fetch only once, use cached data afterwards
    useEffect(() => {
      if (l.length > 0) return; // already have data from cache
      const Getlevel = async () => {
        let companyS = localStorage.getItem("company_") || "";
        try {
          const res = await axios.get(`/api/level?company=${companyS}`); //Get_Employee
          setlevel(res.data);
          localStorage.setItem("level_data", JSON.stringify(res.data));
        } catch (error) {
          console.error(error);
        }
      };
      Getlevel();
    }, []);

    return (
      <>
        <div>
          {/*Detail code สินค้า*/}

          {addhis === 1 ? (
            ""
          ) : addhis === 0 ? (
            <div className={styles.infoCard} style={{ marginBottom: 8 }}>

              {/**    <div className={styles.infoCardHeader}>📦 ข้อมูลสินค้า</div> 
             {/**  <div className={styles.infoCardBody}>
                <div className="row">
                  <div className="col-sm-7">
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>รหัสสินค้า :</div>
                      <div className={styles.infoValueCode}>
                        {String(
                          dataitem
                            .filter(
                              (supplier: any) => supplier.code === codeproductS,
                            )
                            .map((supplier: any) => supplier.code),
                        )}
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>ชื่อสินค้า :</div>
                      <div
                        className={styles.infoValue}
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {String(
                          dataitem
                            .filter(
                              (supplier: any) => supplier.code === codeproductS,
                            )
                            .map((supplier: any) => supplier.ProductName),
                        )}
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>ชื่อเฉพาะทาง :</div>
                      <div
                        className={styles.infoValue}
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {String(
                          dataitem
                            .filter(
                              (supplier: any) => supplier.code === codeproductS,
                            )
                            .map((supplier: any) => supplier.fixname),
                        )}
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>ที่เก็บ :</div>
                      <div className={styles.infoValue}>
                        {String(
                          dataitem
                            .filter(
                              (supplier: any) => supplier.code === codeproductS,
                            )
                            .map((supplier: any) => supplier.Area),
                        )}
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>คงเหลือ :</div>
                      <div className={styles.infoValue}>
                        <span style={{ marginRight: 8 }}>
                          {itembalance.map((r: any) => r.balance)}
                        </span>
                        <span
                          style={{
                            color: "#666",
                            fontFamily: "Kanit",
                            fontSize: 13,
                          }}
                        >
                          {String(
                            dataitem
                              .filter(
                                (supplier: any) =>
                                  supplier.code === codeproductS,
                              )
                              .map((supplier: any) => supplier.Unit),
                          )}
                        </span>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>ราคาขาย :</div>
                      <div className={styles.infoValue}>
                        <span
                          style={{
                            color: "#d32f2f",
                            fontFamily: "Kanit_B",
                            fontSize: 16,
                          }}
                        >
                          {String(
                            dataitem
                              .filter(
                                (supplier: any) =>
                                  supplier.code === codeproductS,
                              )
                              .map((supplier: any) => supplier.price),
                          )}
                        </span>
                        <span
                          style={{
                            color: "#666",
                            fontFamily: "Kanit",
                            fontSize: 13,
                            marginLeft: 4,
                          }}
                        >
                          บาท
                        </span>
                      </div>
                      {l
                        .filter((a: any) => a.codename === "B2")
                        .map((b: any) => b.level1)[0] === true ||
                      l.length <= 0 ||
                      String(localStorage.getItem("level_")) === "level2" ? (
                        <>
                          <div
                            className={styles.infoLabel}
                            style={{ marginLeft: 16 }}
                          >
                            ราคาทุน :
                          </div>
                          <div className={styles.infoValue}>
                            <span style={{ color: "#ff9800", fontSize: 14 }}>
                              {Number(costS).toFixed(0)}
                            </span>
                            <span
                              style={{
                                color: "#666",
                                fontFamily: "Kanit",
                                fontSize: 13,
                                marginLeft: 4,
                              }}
                            >
                              บาท
                            </span>
                          </div>
                        </>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>

                  <div
                    className="col-sm-4"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {String(
                      dataitem
                        .filter(
                          (supplier: any) => supplier.code === codeproductS,
                        )
                        .map((supplier: any) => supplier.pic),
                    ) === "" ? (
                      <div
                        style={{
                          width: 90,
                          height: 120,
                          backgroundColor: "#f5f5f5",
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: 32, color: "#ccc" }}>📷</span>
                      </div>
                    ) : (
                      <img
                        className={styles.productImage}
                        alt=""
                        src={String(
                          dataitem
                            .filter(
                              (supplier: any) => supplier.code === codeproductS,
                            )
                            .map((supplier: any) => supplier.pic),
                        )}
                        style={{ width: 90, height: 120, objectFit: "cover" }}
                      />
                    )}
                  </div>
                </div>*/}

              {/* Indicator Section */}
              {/**  <div className={styles.indicatorSection}>
                  <div className="d-flex align-items-start mb-1">
                    <div
                      className={styles.indicatorTitle}
                      style={{ minWidth: 70 }}
                    >
                      สรรพคุณ :
                    </div>
                    <div className={styles.indicatorContent}>
                      {alllabelitem.indicatorlistS}
                    </div>
                  </div>
                  <div className="d-flex align-items-start mb-1">
                    <div
                      className={styles.indicatorTitle}
                      style={{ minWidth: 70 }}
                    >
                      ข้อบ่งใช้ :
                    </div>
                    <div className={styles.indicatorContent}>
                      {alllabelitem.useS} {alllabelitem.timeuseS}
                    </div>
                  </div>
                  <div className="d-flex align-items-start mb-1">
                    <div className={styles.indicatorContent}>
                      {alllabelitem.timeS} {alllabelitem.keepS}
                    </div>
                  </div>
                  {alllabelitem.remarkS && (
                    <div className="d-flex align-items-start">
                      <div
                        className={styles.indicatorTitle}
                        style={{ minWidth: 70 }}
                      >
                        หมายเหตุ :
                      </div>
                      <div className={styles.indicatorContent}>
                        {alllabelitem.remarkS}
                      </div>
                    </div>
                  )}
                </div> 
              </div>*/}


            </div>
          ) : (
            ""
          )}



          {/*ปุ่ม sale*/}
          <div className={styles.mobileActionContainer}>
            {/* Summary Card */}
            <div className={styles.mobileSummaryCard}>
              <div className={styles.mobileSummaryHeader}>
                <span className={styles.mobileSummaryIcon}>📊</span>
                <span className={styles.mobileSummaryTitle}>สรุปรายการ</span>
              </div>
              <div className={styles.mobileSummaryGrid}>
                <div className={styles.mobileSummaryItem}>
                  <label>จำนวน</label>
                  <span className={styles.mobileSummaryValue}>
                    {list.filter((item) => item.qty > 0).length}
                  </span>
                  <span className={styles.mobileSummaryUnit}>รายการ</span>
                </div>
                <div className={styles.mobileSummaryItem}>
                  <label>ยอดรวม</label>
                  <span className={styles.mobileSummaryValueTotal}>
                    {list
                      .map((num) => num)
                      .reduce((acc, curr) => acc + curr.total, 0)
                      .toLocaleString()}
                  </span>
                  <span className={styles.mobileSummaryUnit}>บาท</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.mobileButtonGroup}>


              <button
                disabled={list.length < 1 ? true : false}
                onClick={() => {
                  (deleteall(),
                    localStorage.setItem("itemlist", String(list.length)),
                    localStorage.setItem("dg", JSON.stringify([])),
                    localStorage.setItem(
                      "his",
                      JSON.stringify([
                        {
                          followup: String(""),
                          solution: String(""),
                          id_history: "",
                          count: String(""),
                          statusH: "",
                          duedate: new Date(),
                          person: String(
                            localStorage.getItem("person_") || "",
                          ),
                        },
                      ]),
                    ));
                }}
                type="button"
                className={styles.mobileCancelButton}
              >
                <span className={styles.mobileButtonIcon}>🗑️</span>
                <span className={styles.mobileButtonText}>ยกเลิก</span>
              </button>


              <button
                disabled={
                  loading || list.length < 1 || savehis === "3" || addhis === 1
                }
                onClick={handleSave}
                type="button"
                className={styles.mobilePayButton}
              >
                {loading ? (
                  <>
                    <SpinnerIcon size={20} color="text-white" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <span className={styles.mobilePayIcon}>💳</span>
                    <span className={styles.mobilePayText}>ชำระสินค้า</span>
                    <span className={styles.mobilePayShortcut}>Enter</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/*ตาราง ลูกค้า*/}
          <div className={styles.customerCard} style={{ marginBottom: 8 }}>
            <div className={styles.customerCardHeader}>👤 ข้อมูลลูกค้า</div>
            <div className={styles.infoCardBody}>
              {/* Search Row */}
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>ค้นหา :</div>
                <div style={{ flex: 1 }}>
                  <Search_Cus />
                </div>
              </div>

              {/* Customer Info */}
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>รหัส :</div>
                <div className={styles.infoValueCode}>
                  {code_cus}
                  {" _ "} {name_cus}
                </div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>เบอร์โทร :</div>
                <div className={styles.infoValue} style={{ minWidth: 100 }}>
                  {tel_cus}
                </div>
                <div className={styles.infoLabel} style={{ marginLeft: 16 }}>
                  แต้มสะสม :
                </div>
                <div className={styles.pointsBadge}>{total_cus} แต้ม</div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>โรคประจำตัว :</div>
                <div className={styles.infoValue}>{congen_cus}</div>
              </div>

              {/* Drug Allergy Table */}
              {Number(id_cus) === 0 ? (
                ""
              ) : (
                <div className={styles.allergyTable}>
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th
                          className={styles.allergyTableHeader}
                          style={{ width: "45%" }}
                        >
                          💊 แพ้สินค้า
                        </th>
                        <th
                          className={styles.allergyTableHeader}
                          style={{ width: "45%" }}
                        >
                          อาการ
                        </th>
                        <th
                          className={styles.allergyTableHeader}
                          style={{ width: "10%" }}
                        ></th>
                      </tr>
                    </thead>
                    <tbody>
                      {drugs?.map((s: any) => (
                        <tr
                          key={s.id}
                          className={`${styles.allergyRow} ${list.filter((w: any) => w.fixname === s.drugallergy).map((r: any) => r.fixname).length > 0 ? styles.allergyWarning : ""}`}
                        >
                          <td
                            style={{
                              fontFamily: "Kanit",
                              fontSize: 11,
                              padding: "4px 12px",
                            }}
                          >
                            {s.drugallergy}
                          </td>
                          <td
                            style={{
                              fontFamily: "Kanit",
                              fontSize: 11,
                              padding: "4px 12px",
                            }}
                          >
                            {s.remark}
                          </td>
                          <td
                            style={{
                              fontFamily: "Kanit_B",
                              fontSize: 10,
                              padding: "4px 12px",
                              textAlign: "center",
                            }}
                          >
                            {list
                              .filter((w: any) => w.fixname === s.drugallergy)
                              .map((r: any) => r.fixname).length > 0
                              ? "⚠️"
                              : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/*เพิ่มประวัติลูกค้า */}
              <div style={{ marginTop: 12 }}>
                <SpeechToText language="th-TH" />
              </div>
            </div>
          </div>

          {/* Modal เพิ่มชื่อลูกค้า สั่งซื้อยา ข.ย.10-13 */}
          <Modal_fill
            show={showCustomerModal}
            onHide={() => setShowCustomerModal(false)}
            dialogClassName="modal-90w"
            aria-labelledby="customer-drug-modal"
            centered
          >
            <Modal_fill.Header closeButton>
              <Modal_fill.Title id="customer-drug-modal">
                <div
                  style={{
                    fontSize: 16,
                    fontFamily: "Kanit_B",
                    color: "#1f2937",
                  }}
                >
                  เพิ่มชื่อลูกค้า สั่งซื้อยา ข.ย.10-13
                </div>
              </Modal_fill.Title>
            </Modal_fill.Header>
            <Modal_fill.Body>
              <div style={{ marginBottom: 16 }}>
                <Table size="sm" bordered hover>
                  <thead style={{ backgroundColor: "#F3F8FC" }}>
                    <tr>
                      <th
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 13,
                          padding: "8px",
                          width: "25%",
                        }}
                      >
                        รหัสสินค้า
                      </th>
                      <th
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 13,
                          padding: "8px",
                          width: "45%",
                        }}
                      >
                        ชื่อสินค้า
                      </th>
                      <th
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 13,
                          padding: "8px",
                          width: "30%",
                        }}
                      >
                        ประเภท
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsNeedCustomer.map((item, idx) => (
                      <tr key={idx}>
                        <td
                          style={{
                            fontFamily: "Kanit",
                            fontSize: 12,
                            padding: "6px 8px",
                          }}
                        >
                          {item.code_product}
                        </td>
                        <td
                          style={{
                            fontFamily: "Kanit",
                            fontSize: 12,
                            padding: "6px 8px",
                          }}
                        >
                          {item.name_product}
                        </td>
                        <td
                          style={{
                            fontFamily: "Kanit",
                            fontSize: 12,
                            padding: "6px 8px",
                            color: "#2A6AAA",
                            fontWeight: 600,
                          }}
                        >
                          {item.cetagory}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div style={{ marginTop: 12 }}>
                <label
                  style={{
                    fontFamily: "Kanit",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  ชื่อลูกค้า
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="กรอกชื่อลูกค้า..."
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  style={{
                    fontFamily: "Kanit",
                    fontSize: 14,
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                  autoFocus
                />
              </div>
            </Modal_fill.Body>
            <Modal_fill.Footer>
              <button
                className="btn btn-success"
                style={{
                  fontFamily: "Kanit",
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 10,
                  padding: "8px 24px",
                }}
                disabled={customerNameInput.trim() === ""}
                onClick={handleConfirmCustomerModal}
              >
                ตกลง
              </button>
              <button
                className="btn btn-secondary"
                style={{
                  fontFamily: "Kanit",
                  fontSize: 15,
                  borderRadius: 10,
                  padding: "8px 24px",
                }}
                onClick={() => setShowCustomerModal(false)}
              >
                ปิด
              </button>
            </Modal_fill.Footer>
          </Modal_fill>

          {/**Promotion */}
          {code_Promotion.length > 0 ? (
            <div
              className="row-4 mt-1 shadow-sm rounded border  "
              style={{ backgroundColor: "white" }}
            >
              <div
                className="d-flex  mt-1 mb-1 "
                style={{ justifyContent: "center" }}
              >
                <div className="" style={{ width: 200 }}>
                  <div className={styles.bodydetail_head}>
                    ส่วนลด โปรโมชั่น{" "}
                    {Number(
                      P_percent.percent == undefined
                        ? 0
                        : P_percent.percent.perscentTotal,
                    ) +
                      Number(
                        P_baht.baht == undefined ? 0 : P_baht.baht.bahtTotal,
                      )}{" "}
                    บาท
                  </div>
                </div>
              </div>
              <div className="" style={{ overflowY: "auto" }}>
                <Table className="table" size="sm">
                  <thead className="">
                    <tr className="">
                      <th
                        scope="col"
                        className={styles.bodydetailTable_Re}
                        style={{ width: "30%" }}
                      >
                        ชื่อโปรโมชั่น
                      </th>
                      <th
                        scope="col"
                        className={styles.bodydetailTable_Re}
                        style={{ width: "15%" }}
                      >
                        ลูกค้า
                      </th>
                      <th
                        scope="col"
                        className={styles.bodydetailTable_Re}
                        style={{ width: "40%" }}
                      >
                        โปรโมชั่น
                      </th>
                      <th
                        scope="col"
                        className={styles.bodydetailTable_Re}
                        style={{ width: "40%" }}
                      >
                        คำนวณ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-group-divider">
                    {code_Promotion.map((a: any) => (
                      <tr className="" key={a.id}>
                        <th
                          scope="row"
                          className={styles.bodydetailTable_Re1}
                          style={{ width: "30%" }}
                        >
                          {a.name_promotion}
                        </th>
                        <td
                          className={styles.bodydetailTable_Re1}
                          style={{ width: "15%" }}
                        >
                          {a.customer}
                        </td>
                        <td
                          className={styles.bodydetailTable_Re1}
                          style={{ width: "40%" }}
                        >
                          {a.msg_condition + " " + a.msg_discount}
                        </td>
                        <td
                          className={styles.bodydetailTable_Re1}
                          style={{ width: "40%" }}
                        >
                          {list
                            .map((num) => num)
                            .reduce((acc, curr) => acc + curr.total, 0) >=
                            Number(a.pay_condition)
                            ? a.unit === "percent"
                              ? (list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0) *
                                Number(a.discount)) /
                              100
                              : a.unit === "baht"
                                ? Number(a.discount)
                                : 0
                            : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      </>
    );
  }

  // After Sale
  function Afterpay() {
    const isSubmitting = useRef(false);

    const handleAutoPrint_rc = async () => {
      if (!isSilentPrintAvailable()) {
        alert("ไม่พบช่องทางการพิมพ์ของเครื่องนี้");
        return;
      }

      const horizontalOffset = getThermalReceiptHorizontalOffset(false);

      const content = `
        <div style="width: 67mm; background-color: white;  box-sizing: border-box; font-family: 'Kanit'; justify-self: left;">
          
          <div style="width: 100%; display: flex; justify-content: center; margin-bottom: 5px;">
             ${uploadedUrl ? `<img src="${String(uploadedUrl)}" style="width: 50px; height: 50px;" />` : ""}
          </div>

          <div style="text-align: center; font-size: 13px; font-family: 'Kanit';">ใบเสร็จรับเงิน</div>
          <div style="text-align: center; font-size: 17px; font-family: 'Kanit'; font-weight: bold;">${storeS}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">${addressS}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">เลขที่ผู้เสียภาษี : ${taxS}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">โทร : ${telS}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">--------------------------------------</div>
          
          <div style="font-size: 10px; font-family: 'Kanit'; text-align: left;">พนักงานขาย : ${localStorage.getItem("person_") || ""}</div>
           <div style="font-size: 10px; font-family: 'Kanit'; text-align: left;">
            วันที่ : ${new Date().toLocaleDateString("es-US", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bangkok" })}&nbsp;&nbsp;&nbsp;
            ${new Date().toLocaleTimeString("en-US", { hour12: false, hour: "numeric", minute: "numeric", timeZone: "Asia/Bangkok" })}
          </div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">--------------------------------------</div>
          <div style="font-size: 10px; font-family: 'Kanit'; text-align: left;">ลูกค้า : ${name_cus === "" ? "ลูกค้าทั่วไป" : name_cus}</div>
          <div style="text-align: center; font-size: 10px; font-family: 'Kanit';">--------------------------------------</div>

          <!-- Header -->
          <div style="display: flex; font-size: 7px; font-family: 'Kanit'; font-weight: bold; border-bottom: 1px dashed black; padding-bottom: 2px; margin-bottom: 2px;">
             <div style="flex-grow: 1; text-align: left; width: 50%;">รายการ</div>
             <div style="text-align: center; width: 9%;">จำนวน</div>
             <div style="text-align: right; width: 9%;">หน่วย</div>
             <div style="text-align: right; width: 9%;">ราคา</div>
             <div style="text-align: right; width: 9%;">ลด/ชิ้น</div>
             <div style="text-align: right; width: 12%;">รวม</div>
          </div>

          <!-- List -->
          <div style="display: flex; flex-direction: column;">
            ${list
          .map(
            (a: any) => `
              <div style="display: flex; font-size: 10px; font-family: 'Kanit'; font-weight: bold; margin-bottom: 2px;">
                <div style="flex-grow: 1; text-align: left; width: 50%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.name_product}</div>
                <div style="text-align: center; width: 9%;">${a.qty}</div>
                <div style="text-align: right; font-size: 6px; width: 9%;">${a.unit}</div>
                <div style="text-align: right; width: 9%;">${a.price}</div>
                <div style="text-align: right;  width: 9%;">${a.discount}</div>
                <div style="text-align: right; width: 12%;">${a.total}</div>
              </div>
            `,
          )
          .join("")}
          </div>

          <div style="text-align: center; font-size: 10px; font-family: 'Kanit'; margin-top: 5px;">--------------------------------------</div>
          <div style="font-size: 10px; font-family: 'Kanit'; text-align: left;">ทั้งหมด : ${list.length} รายการ    ชำระสินค้า : ${alldatalist.pay === "payment" ? "โอน" : alldatalist.pay === "cash" ? "เงินสด" : ""}</div>
          
          <!-- Footer Totals -->
          <div style="display: flex; margin-top: 10px;">
             <!-- Left side (Points) -->
             <div style="width: 30%;">
                
             </div>

             <!-- Right side (Money) -->
             <div style="width: 70%;">
                <div style="display: flex; font-size: 10px; font-family: 'Kanit'; justify-content: flex-end;">
                  <div style="text-align: right; margin-right: 5px;">รวมเงิน :</div>
                  <div style="width: 40px; text-align: right;">${list.map((num) => num).reduce((acc, curr) => acc + curr.total, 0)}</div>
                   <div style="width: 25px; text-align: right;">บาท</div>
                </div>
                <div style="display: flex; font-size: 10px; font-family: 'Kanit'; justify-content: flex-end;">
                  <div style="width: 60px; text-align: right; margin-right: 5px;">ส่วนลด :</div>
                   <div style="width: 40px; text-align: right;">${Number(alldatalist.discount) + Number(alldatalist.promotion)}</div>
                   <div style="width: 25px; text-align: right;">บาท</div>
                </div>
                  <div style="display: flex; font-size: 10px; font-family: 'Kanit'; justify-content: flex-end;">
                  <div style="width: 70px; text-align: right; margin-right: 5px;">ใช้แต้มส่วนลด :</div>
                   <div style="width: 40px; text-align: right;">${Number(isNaN(Number(parseInt(alldatalist.usereward))) === true ? 0 : Number(parseInt(alldatalist.usereward))).toLocaleString()}</div>
                   <div style="width: 25px; text-align: right;">บาท</div>
                </div>
                 <div style=" display: flex; font-size: 11px; font-family: 'Kanit'; font-weight: bold; justify-content: flex-end; margin-top: 5px;">
                  <div style="width: 70px; text-align: right; margin-right: 5px;">ยอดรวมสุทธิ :</div>
                   <div style="width: 40px; text-align: right;">${(
          Number(list.reduce((acc, curr) => acc + curr.total, 0)) -
          (Number(alldatalist.discount) +
            Number(alldatalist.promotion) +
            Number(
              isNaN(Number(parseInt(alldatalist.usereward))) === true
                ? 0
                : Number(parseInt(alldatalist.usereward)),
            ))
        ).toLocaleString()}</div>
                   <div style="width: 25px; text-align: right;">บาท</div>
                </div>
             </div>
          </div>

        </div>
      `;

      try {
        await printSilent({
          content: content,
          printerName: selectedPrinter_rc,
          horizontalOffset,
        });
        toast.success(
          <div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>,
          {
            description: (
              <div style={{ fontFamily: "Kanit", fontSize: 20 }}>
                {" "}
                ส่งพิมพ์เรียบร้อย
              </div>
            ),
            duration: 3000,
          },
        );
      } catch (error) {
        console.error("Printing failed:", error);
        alert("Printing failed");
      }
    };

    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn1 = useReactToPrint({
      contentRef,
      print: async (iframe: HTMLIFrameElement) => {
        const html = iframe.contentDocument?.documentElement.outerHTML;

        if (html && isSilentPrintAvailable()) {
          handleAutoPrint_rc();
        } else {
          // เบราว์เซอร์ล้วน: ไม่มีช่องทางพิมพ์เงียบ ต้องเด้ง dialog ของระบบ
          await iframe.contentWindow?.print();
        }
      },
    });

    //*********Loading*********************** */
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
      if (loading || isSubmitting.current) return;

      // Validation: Check if change is negative (insufficient payment)
      const totalAmount = Number(
        list.reduce((acc, curr) => acc + curr.total, 0),
      );
      const netTotal =
        totalAmount -
        Number(alldatalist.discount || 0) -
        Number(alldatalist.promotion || 0) -
        Number(alldatalist.usereward || 0);
      const change = Number(alldatalist.receivebaht || 0) - netTotal;

      if (change < 0) {
        toast.error("ไม่สามารถชำระสินค้าได้ เนื่องจากเงินรับน้อยกว่ายอดสุทธิ");
        return;
      }

      setLoading(true);
      isSubmitting.current = true;

      try {
        const result = await SaleMainSubmit();
        const billId = result?.data?.bill_id || "";

        toast.success(
          <div style={{ fontFamily: "Kanit", fontSize: 14 }}>
            <b>ชำระสินค้าสำเร็จ!</b>
            {billId && <div>เลขที่บิล: {billId}</div>}
          </div>,
        );

        setMessage("");
        localStorage.setItem("dg", JSON.stringify([]));

        // Print only on success
        if (isSilentPrintAvailable()) {
          handleAutoPrint_rc();
        } else if (contentRef.current) {
          reactToPrintFn1();
        }
      } catch (error) {
        console.error("Sale submission failed:", error);
        toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
        isSubmitting.current = false;
      }
    };

    //****************************************** */

    const handlePay = () => {
      handleClick();
    };
    const handlePrint = () => {
      const totalAmount = Number(
        list.reduce((acc, curr) => acc + curr.total, 0),
      );
      const netTotal =
        totalAmount -
        Number(alldatalist.discount || 0) -
        Number(alldatalist.promotion || 0) -
        Number(alldatalist.usereward || 0);
      const change = Number(alldatalist.receivebaht || 0) - netTotal;

      if (change < 0) {
        toast.error(
          "ไม่สามารถพิมพ์ใบเสร็จได้ เนื่องจากเงินรับน้อยกว่ายอดสุทธิ",
        );
        return;
      }
      reactToPrintFn1();
    };
    // const handlePrint1 = handleAutoPrint_rc;
    const handleback = () => {
      (localStorage.setItem(
        "showhead",
        String(Math.floor(Math.random() * 100) + 1),
      ),
        setchangePay("2"),
        setMessage(""),
        localStorage.setItem("pay_s", "cash"));
      setSelectedOption("cash");
    };

    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        switch (key) {
          case "f12":
            event.preventDefault();
            handlePay();
            break;
          case "f11":
            event.preventDefault();
            handlePrint();
            //    handlePrint1();
            break;
          case "f10":
            event.preventDefault();
            handleback();
            break;
        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener("keydown", handleKeyDown as EventListener);

      return () => {
        window.removeEventListener("keydown", handleKeyDown as EventListener);
      };
    }, [handlePay, handlePrint, handleback]);

    return (
      <div className={styles.afterpayContainer}>
        {/* Title */}
        <div className={styles.afterpayTitle}>💳 สรุปข้อมูลการขาย</div>

        <div className="row">
          {/* Left Column - Sale Info */}
          <div className="col-sm-7">
            {/* Customer & Date Info Card */}
            <div className={styles.afterpayInfoCard}>
              <div className={styles.afterpayInfoGrid}>
                <div className={styles.afterpayInfoRow}>
                  <div className={styles.afterpayLabel}>📅 วันที่ :</div>
                  <div className={styles.afterpayValue}>
                    {new Date().toLocaleDateString("es-US", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    &nbsp;
                    {new Date().toLocaleTimeString("en-US", {
                      hour12: false,
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </div>
                </div>
                <div className={styles.afterpayInfoRow}>
                  <div className={styles.afterpayLabel}>👤 สมาชิก :</div>
                  <div className={styles.afterpayValue}>
                    {code_cus === "" ? "ลูกค้าทั่วไป" : code_cus}&nbsp;&nbsp;
                    {name_cus}
                  </div>
                </div>
              </div>
            </div>

            {/* Points Card */}
            <div
              className={styles.pointsCard}
              style={{ height: 45, marginBottom: 5 }}
            >
              <div className={styles.pointsTitle}>🎯 แต้มสะสมลูกค้า</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div
                  className={styles.pointsRow}
                  style={{ flex: 1, minWidth: 120 }}
                >
                  <div className={styles.pointsLabel}>แต้มทั้งหมด :</div>
                  <div>
                    <span className={styles.pointsValue}>
                      {code_cus === "" ? 0 : total_cus}
                    </span>
                    <span className={styles.pointsUnit}>แต้ม</span>
                  </div>
                </div>
                <div
                  className={styles.pointsRow}
                  style={{ flex: 1, minWidth: 120 }}
                >
                  <div className={styles.pointsLabel}>แต้มยอดบิล :</div>
                  <div>
                    <span className={styles.pointsValue}>
                      {isNaN(
                        parseInt(
                          String(
                            Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) /
                            (Number(SaleS) / Number(pointeqS)),
                          ),
                        ),
                      ) === true
                        ? 0
                        : parseInt(
                          String(
                            Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) /
                            (Number(SaleS) / Number(pointeqS)),
                          ),
                        )}
                    </span>
                    <span className={styles.pointsUnit}>แต้ม</span>
                  </div>
                </div>
                <div
                  className={styles.pointsRow}
                  style={{ flex: 1, minWidth: 120 }}
                >
                  <div className={styles.pointsLabel}>แต้มรวม :</div>
                  <div>
                    <span className={styles.pointsValue}>
                      {isNaN(
                        parseInt(
                          String(
                            Number(total_cus) +
                            Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) /
                            (Number(SaleS) / Number(pointeqS)),
                          ),
                        ) - Number(localStorage.getItem("usereward_s") || 0),
                      ) === true
                        ? 0
                        : parseInt(
                          String(
                            Number(total_cus) +
                            Number(
                              list
                                .map((num) => num)
                                .reduce((acc, curr) => acc + curr.total, 0),
                            ) /
                            (Number(SaleS) / Number(pointeqS)),
                          ),
                        ) - Number(localStorage.getItem("usereward_s") || 0)}
                    </span>
                    <span className={styles.pointsUnit}>แต้ม</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className={styles.paymentCard} style={{ padding: "8px" }}>
              {/* Compact Summary Row (Total & Discounts) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  padding: "0 8px",
                  fontFamily: "Kanit",
                  fontSize: 14,
                  color: "#64748b",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>💰</span> ยอดรวม:
                  <span
                    style={{
                      fontFamily: "Kanit_B",
                      color: "#1e293b",
                      fontSize: 16,
                    }}
                  >
                    {list
                      .reduce((acc, curr) => acc + curr.total, 0)
                      .toLocaleString()}
                  </span>
                  <span>บาท</span>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span>🎁</span> แต้มลด: <Usereward_s />
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span>🏷️</span> ส่วนลด: <Discount_s />
                  </div>
                </div>
              </div>

              <div className={styles.summaryBoxContainer}>
                {/* Net Total Box */}
                <div className={`${styles.summaryBox} ${styles.summaryBoxNet}`}>
                  <div className={styles.summaryBoxTitle}>
                    <span style={{ fontSize: 18 }}>✅</span> ยอดสุทธิ :
                  </div>
                  <div className={styles.summaryBoxContent}>
                    <div className={styles.summaryBoxAmount}>
                      {(
                        Number(
                          list.reduce((acc, curr) => acc + curr.total, 0),
                        ) -
                        (Number(alldatalist.discount) +
                          Number(alldatalist.promotion) +
                          Number(
                            isNaN(Number(parseInt(alldatalist.usereward))) ===
                              true
                              ? 0
                              : Number(parseInt(alldatalist.usereward)),
                          ))
                      ).toLocaleString()}
                    </div>
                    <div className={styles.summaryBoxUnit}>บาท</div>
                  </div>
                </div>

                {/* Receive Amount Box */}
                <div
                  className={`${styles.summaryBox} ${styles.summaryBoxReceive}`}
                >
                  <div className={styles.summaryBoxTitle}>
                    <span style={{ fontSize: 18 }}>💵</span> รับเงิน :
                  </div>
                  <div className={styles.summaryBoxContent}>
                    <Rereveive_s />
                    <div className={styles.summaryBoxUnit}>บาท</div>
                  </div>
                </div>

                {/* Change Box */}
                <div
                  className={`${styles.summaryBox} ${styles.summaryBoxChange}`}
                >
                  <div className={styles.summaryBoxTitle}>
                    <span style={{ fontSize: 18 }}>💸</span> เงินทอน :
                  </div>
                  <div className={styles.summaryBoxContent}>
                    <div className={styles.summaryBoxAmount}>
                      {(
                        Number(alldatalist.receivebaht) -
                        Number(
                          list.reduce((acc, curr) => acc + curr.total, 0),
                        ) +
                        (Number(alldatalist.discount) +
                          Number(alldatalist.promotion) +
                          Number(
                            isNaN(Number(parseInt(alldatalist.usereward))) ===
                              true
                              ? 0
                              : Number(parseInt(alldatalist.usereward)),
                          ))
                      ).toLocaleString()}
                    </div>
                    <div className={styles.summaryBoxUnit}>บาท</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className={styles.paymentMethodCard}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div className={styles.paymentMethodLabel}>
                  💳 ช่องทางชำระ :
                </div>
                <Radio_pay />
              </div>
            </div>

            {/* Error Message */}
            {Number(alldatalist.receivebaht || 0) -
              (Number(
                list
                  .map((num) => num)
                  .reduce((acc, curr) => acc + curr.total, 0),
              ) -
                Number(alldatalist.discount || 0) -
                Number(alldatalist.promotion || 0) -
                Number(alldatalist.usereward || 0)) <
              0 && (
                <div className={styles.errorMessage}>
                  ⚠️ ไม่สามารถชำระสินค้าได้ เนื่องจากเงินทอนติดลบ
                </div>
              )}

            {/* Action Buttons */}
            <div className={styles.mobileActionContainer}>
              <div className={styles.mobileButtonGroup}>
                <div className={styles.mobileButtonRow}>
                  <button
                    onClick={handlePrint}
                    type="button"
                    className={styles.mobilePrintButton}
                  >
                    <span className={styles.mobileButtonIcon}>🖨️</span>
                    <span className={styles.mobileButtonText}>พิมพ์ใบเสร็จ</span>
                    <span className={styles.mobileButtonShortcut}>F11</span>
                  </button>

                  <button
                    onClick={handleback}
                    type="button"
                    className={styles.mobileBackButton}
                  >
                    <span className={styles.mobileButtonIcon}>↩️</span>
                    <span className={styles.mobileButtonText}>กลับ</span>
                    <span className={styles.mobileButtonShortcut}>F10</span>
                  </button>
                </div>

                <button
                  ref={confirmPaymentRef}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handlePay();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePay();
                    }
                  }}
                  type="button"
                  disabled={loading || addhis === 1}
                  className={styles.mobileConfirmButton}
                >
                  {loading ? (
                    <>
                      <SpinnerIcon size={20} color="text-white" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.mobilePayIcon}>✅</span>
                      <span className={styles.mobilePayText}>ชำระสินค้า</span>
                      <span className={styles.mobilePayShortcut}>Enter, F12</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Template Buttons */}
            <div className={styles.templateButtons}>
              <QuotationTemplate /> {/**ใบเสนอราคา */}
              <BillTemplate /> {/**ใบวางบิล */}
              <InvoiceTemplate /> {/**ใบแจ้งหนี้ */}
              <ReTemplate /> {/**ใบเสร็จรับเงิน */}
            </div>
          </div>

          {/** Slip */}
          <div className="col-sm-5 ">
            <div className={styles.receiptSlip} ref={contentRef}>
              <div className={styles.receiptHeader}>
                <div style={{ width: 50, height: 50, margin: "0 auto 8px" }}>
                  <img
                    alt={""}
                    src={String(uploadedUrl)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <div style={{ fontFamily: "Kanit", fontSize: 13 }}>
                  ใบเสร็จรับเงิน
                </div>
                <div className={styles.receiptStoreName}>{storeS}</div>
                <div className={styles.receiptAddress}>{addressS}</div>
                <div className={styles.receiptAddress}>
                  เลขที่ผู้เสียภาษี : {taxS}
                </div>
                <div className={styles.receiptAddress}>โทร : {telS}</div>
              </div>

              <div className={styles.receiptDivider}>
                --------------------------------------
              </div>

              <div
                style={{ fontFamily: "Kanit", fontSize: 10, textAlign: "left" }}
              >
                พนักงานขาย : {String(localStorage.getItem("person_") || "")}
              </div>
              <div
                style={{ fontFamily: "Kanit", fontSize: 10, textAlign: "left" }}
              >
                วันที่ :{" "}
                {new Date().toLocaleDateString("es-US", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
                &nbsp;&nbsp;&nbsp;
                {new Date().toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "numeric",
                  minute: "numeric",
                })}
              </div>

              <div className={styles.receiptDivider}>
                --------------------------------------
              </div>
              <div
                style={{ fontFamily: "Kanit", fontSize: 10, textAlign: "left" }}
              >
                ลูกค้า : {name_cus === "" ? "ลูกค้าทั่วไป" : name_cus}
              </div>
              <div className={styles.receiptDivider}>
                --------------------------------------
              </div>

              {/* Item Header */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px dashed #ddd",
                  paddingBottom: 4,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontFamily: "Kanit_B",
                    fontSize: 8,
                    textAlign: "start",
                  }}
                >
                  รายการ
                </div>
                <div
                  style={{
                    fontFamily: "Kanit_B",
                    fontSize: 8,
                    textAlign: "center",
                    width: 25,
                  }}
                >
                  จำนวน
                </div>
                <div
                  style={{
                    fontFamily: "Kanit_B",
                    fontSize: 8,
                    textAlign: "center",
                    width: 25,
                  }}
                >
                  หน่วย
                </div>
                <div
                  style={{
                    fontFamily: "Kanit_B",
                    fontSize: 8,
                    textAlign: "right",
                    width: 25,
                  }}
                >
                  ราคา
                </div>
                <div
                  style={{
                    fontFamily: "Kanit_B",
                    fontSize: 8,
                    textAlign: "right",
                    width: 25,
                  }}
                >
                  ลด
                </div>
                <div
                  style={{
                    fontFamily: "Kanit_B",
                    fontSize: 8,
                    textAlign: "right",
                    width: 30,
                  }}
                >
                  รวม
                </div>
              </div>

              {/* Item List */}
              {list.map((a: any) => {
                const drugTypes = [
                  "ขย.10",
                  "ขย.11",
                  "ขย.12",
                  "ขย.13",
                  "ข.ย.10",
                  "ข.ย.11",
                  "ข.ย.12",
                  "ข.ย.13",
                ];
                const prod = dataProduct.find(
                  (p: any) => p.code === a.code_product,
                );
                const matchType =
                  prod && drugTypes.includes(prod.type) ? prod.type : null;
                const matchSubtype =
                  prod && drugTypes.includes(prod.subtype)
                    ? prod.subtype
                    : null;
                const drugLabel = matchType || matchSubtype;
                return (
                  <div key={a.id}>
                    <div style={{ display: "flex", padding: "2px 0" }}>
                      <div
                        style={{
                          flex: 1,
                          fontFamily: "Kanit",
                          fontSize: 10,
                          textAlign: "start",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {a.name_product}
                      </div>
                      <div
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          textAlign: "center",
                          width: 25,
                        }}
                      >
                        {a.qty}
                      </div>
                      <div
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 9,
                          textAlign: "center",
                          width: 25,
                        }}
                      >
                        {a.unit}
                      </div>
                      <div
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          textAlign: "right",
                          width: 25,
                        }}
                      >
                        {a.price}
                      </div>
                      <div
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          textAlign: "right",
                          width: 25,
                        }}
                      >
                        {a.discount}
                      </div>
                      <div
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          textAlign: "right",
                          width: 30,
                        }}
                      >
                        {a.total}
                      </div>
                    </div>
                    {drugLabel && a.name_customer && (
                      <div
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 9,
                          color: "#2A6AAA",
                          fontWeight: 600,
                          paddingLeft: 4,
                        }}
                      >
                        ผู้ซื้อ: {a.name_customer}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={styles.receiptDivider}>
                --------------------------------------
              </div>
              <div
                style={{ fontFamily: "Kanit", fontSize: 10, textAlign: "left" }}
              >
                ทั้งหมด : {list.length} รายการ &nbsp;&nbsp; ชำระสินค้า :{" "}
                {alldatalist.pay === "payment"
                  ? "โอน"
                  : alldatalist.pay === "cash"
                    ? "เงินสด"
                    : ""}
              </div>

              {/* Footer - Points & Total */}
              <div className={styles.receiptTotalSection}>
                <div style={{ display: "flex" }}>
                  {/* Points Column */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        padding: "2px 0",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          width: 70,
                          textAlign: "right",
                        }}
                      >
                        แต้มทั้งหมด :
                      </span>
                      <span
                        style={{
                          fontFamily: "Kanit_B",
                          fontSize: 10,
                          width: 30,
                          textAlign: "center",
                        }}
                      >
                        {total_cus === "" ? 0 : total_cus}
                      </span>
                      <span style={{ fontFamily: "Kanit", fontSize: 10 }}>
                        แต้ม
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        padding: "2px 0",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          width: 70,
                          textAlign: "right",
                        }}
                      >
                        แต้มยอดบิล :
                      </span>
                      <span
                        style={{
                          fontFamily: "Kanit_B",
                          fontSize: 10,
                          width: 30,
                          textAlign: "center",
                        }}
                      >
                        {total_cus === ""
                          ? 0
                          : parseInt(
                            String(
                              Number(
                                list
                                  .map((num) => num)
                                  .reduce((acc, curr) => acc + curr.total, 0),
                              ) /
                              (Number(SaleS) / Number(pointeqS)),
                            ),
                          )}
                      </span>
                      <span style={{ fontFamily: "Kanit", fontSize: 10 }}>
                        แต้ม
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        padding: "2px 0",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          width: 70,
                          textAlign: "right",
                        }}
                      >
                        แต้มรวม :
                      </span>
                      <span
                        style={{
                          fontFamily: "Kanit_B",
                          fontSize: 10,
                          width: 30,
                          textAlign: "center",
                        }}
                      >
                        {total_cus === ""
                          ? 0
                          : parseInt(
                            String(
                              Number(total_cus) +
                              Number(
                                list
                                  .map((num) => num)
                                  .reduce(
                                    (acc, curr) => acc + curr.total,
                                    0,
                                  ),
                              ) /
                              (Number(SaleS) / Number(pointeqS)),
                            ),
                          )}
                      </span>
                      <span style={{ fontFamily: "Kanit", fontSize: 10 }}>
                        แต้ม
                      </span>
                    </div>
                  </div>

                  {/* Money Column */}
                  <div style={{ flex: 1 }}>
                    <div className={styles.receiptTotalRow}>
                      <span className={styles.receiptTotalLabel}>
                        รวมเงิน :
                      </span>
                      <span className={styles.receiptTotalValue}>
                        {list
                          .map((num) => num)
                          .reduce((acc, curr) => acc + curr.total, 0)}
                      </span>
                      <span
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        บาท
                      </span>
                    </div>
                    <div className={styles.receiptTotalRow}>
                      <span className={styles.receiptTotalLabel}>ส่วนลด :</span>
                      <span className={styles.receiptTotalValue}>
                        {Number(alldatalist.discount) +
                          Number(alldatalist.promotion)}
                      </span>
                      <span
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        บาท
                      </span>
                    </div>
                    <div className={styles.receiptTotalRow}>
                      <span className={styles.receiptTotalLabel}>
                        ใช้แต้มส่วนลด :
                      </span>
                      <span className={styles.receiptTotalValue}>
                        {parseInt(String(alldatalist.usereward))}
                      </span>
                      <span
                        style={{
                          fontFamily: "Kanit",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        บาท
                      </span>
                    </div>
                    <div
                      className={styles.receiptTotalRow}
                      style={{
                        background: "#F8FAFC",
                        borderRadius: 4,
                        padding: "4px 8px",
                        marginTop: 4,
                      }}
                    >
                      <span className={styles.receiptNetTotal}>
                        ยอดรวมสุทธิ :
                      </span>
                      <span
                        className={styles.receiptNetTotal}
                        style={{ marginLeft: 8, height: 10 }}
                      >
                        {Number(
                          list
                            .map((num) => num)
                            .reduce((acc, curr) => acc + curr.total, 0),
                        ) -
                          Number(alldatalist.discount) -
                          Number(alldatalist.promotion) -
                          Number(parseInt(alldatalist.usereward))}
                      </span>
                      <span
                        className={styles.receiptNetTotal}
                        style={{ marginLeft: 4 }}
                      >
                        บาท
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [isChecked, setIsChecked] = useState(true);

  const handleCheckboxChange = (event: any) => {
    setIsChecked(event.target.checked);
  };

  //${"50"}
  //Print Label
  const handleAutoPrint_label = async () => {
    if (!isSilentPrintAvailable()) {
      alert("ไม่พบช่องทางการพิมพ์ของเครื่องนี้");
      return;
    }

    const selectedOption1 =
      typeof window !== "undefined" ? localStorage.getItem("lg") || "th" : "th";
    const content = ReactDOMServer.renderToStaticMarkup(
      <div style={{ width: "100mm", fontFamily: "Kanit" }}>
        {list
          .filter((q: any) => q.label === true)
          .map((a: any) => (
            <div
              key={a.id}
              id="selcet-print"
              className="col-12 rounded border border-2 shadow shadow-sm"
              style={{
                height: 200,
                backgroundColor: "white",
                marginBottom: "10px",
                pageBreakInside: "avoid",
              }}
            >
              <div className="row">
                <Container style={{ height: 60 }}>
                  {allS === false ? (
                    <Row>
                      {logoS === true ? (
                        <Col sm={2}>
                          <div
                            style={{
                              maxWidth: 45,
                              width: 45,
                              marginTop: 5,
                              justifyItems: "center",
                              marginLeft: 5,
                            }}
                          >
                            <img
                              alt={""}
                              src={String(uploadedUrl)}
                              width={55}
                              height={50}
                            />
                          </div>
                        </Col>
                      ) : (
                        ""
                      )}
                      <Col
                        sm={5}
                        style={{ marginLeft: logoS === true ? 10 : 35 }}
                      >
                        <div className="row">
                          <div
                            className={logoS === true ? "col-8" : "col-9"}
                            style={{
                              fontFamily: "kanit_B",
                              fontSize: 16,
                              textAlign: "start",
                              width: "100%",
                            }}
                          >
                            {storeS}
                          </div>
                        </div>
                        <div
                          style={{
                            fontFamily: "kanit",
                            fontSize: 9,
                            width: 200,
                          }}
                        >
                          {addressS}
                          {" โทร : "} {telS}
                        </div>
                        <div
                          className="row rounded  shadow shadow mb-2"
                          style={{
                            borderColor: "black",
                            fontFamily: "kanit",
                            height: 2,
                            fontSize: 10,
                            backgroundColor: "black",
                          }}
                        ></div>
                      </Col>
                      {lineS === true ? (
                        <Col sm={2}>
                          <div
                            style={{ maxWidth: 45, width: 45, marginLeft: 10 }}
                          >
                            <img
                              alt={""}
                              src={String(uploadedUrl1)}
                              width={60}
                              height={60}
                            />
                            <div
                              style={{
                                fontFamily: "kanit",
                                fontSize: 8,
                                textAlign: "center",
                              }}
                            >
                              Line ร้านค้า
                            </div>
                          </div>
                        </Col>
                      ) : (
                        ""
                      )}
                    </Row>
                  ) : (
                    ""
                  )}
                </Container>

                <div>
                  {allS === true ? (
                    <div
                      className="row "
                      style={{
                        marginLeft: 8,
                        backgroundColor: "black",
                        width: "95%",
                        borderColor: "black",
                        height: 2,
                      }}
                    ></div>
                  ) : (
                    ""
                  )}
                  <div className="row mt-1">
                    <div
                      className="col-auto me-auto "
                      style={{
                        fontFamily: "kanit",
                        fontSize: 10,
                        textAlign: "start",
                        marginLeft: 5,
                      }}
                    >
                      {typeof name_cus !== "undefined" && name_cus === ""
                        ? "ลูกค้าทั่วไป"
                        : typeof name_cus !== "undefined"
                          ? name_cus
                          : "ลูกค้าทั่วไป"}
                    </div>
                    <div
                      className="col-auto"
                      style={{
                        fontFamily: "kanit",
                        fontSize: 10,
                        textAlign: "end",
                        marginRight: 10,
                      }}
                    >
                      {new Date().toLocaleDateString("es-US", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="row" style={{ height: "20vh" }}>
                    <div className="col-9 me-auto">
                      <div
                        className="d-flex"
                        style={{
                          fontFamily: "kanit_B",
                          fontSize: 13,
                          textAlign: "start",
                          marginLeft: 5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        {a.name_product}
                      </div>
                      <div
                        className="d-flex"
                        style={{
                          fontFamily: "kanit",
                          fontSize: 13,
                          textAlign: "start",
                          marginLeft: 5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        {selectedOption1 === "th"
                          ? a.indicatorlistS
                          : selectedOption1 === "my"
                            ? a.my_indicatorlistS
                            : selectedOption1 === "lo"
                              ? a.lo_indicatorlistS
                              : selectedOption1 === "en"
                                ? a.en_indicatorlistS
                                : selectedOption1 === "zh-CN"
                                  ? a.zh_indicatorlistS
                                  : ""}
                      </div>

                      <div
                        className="d-flex"
                        style={{
                          fontFamily: "kanit",
                          fontSize: 11,
                          textAlign: "start",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        <div
                          className="d-flex"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "start",
                            marginLeft: 5,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "100%",
                          }}
                        >
                          {selectedOption1 === "th"
                            ? a.useS
                            : selectedOption1 === "my"
                              ? a.my_useS
                              : selectedOption1 === "lo"
                                ? a.lo_useS
                                : selectedOption1 === "en"
                                  ? a.en_useS
                                  : selectedOption1 === "zh-CN"
                                    ? a.zh_useS
                                    : ""}
                          &nbsp;&nbsp;&nbsp;
                          {selectedOption1 === "th"
                            ? a.timeuseS
                            : selectedOption1 === "my"
                              ? a.my_timeuseS
                              : selectedOption1 === "lo"
                                ? a.lo_timeuseS
                                : selectedOption1 === "en"
                                  ? a.en_timeuseS
                                  : selectedOption1 === "zh-CN"
                                    ? a.zh_timeuseS
                                    : ""}
                        </div>
                      </div>

                      {/**     <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.timeuseS}</div>*/}

                      <div
                        className="d-flex"
                        style={{
                          fontFamily: "kanit",
                          fontSize: 11,
                          textAlign: "start",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        {/**  {a.timeS} */}
                        <div
                          className="d-flex"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "start",
                            marginLeft: 5,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "100%",
                          }}
                        >
                          {selectedOption1 === "th"
                            ? a.timeS
                            : selectedOption1 === "my"
                              ? a.my_timeS
                              : selectedOption1 === "lo"
                                ? a.lo_timeS
                                : selectedOption1 === "en"
                                  ? a.en_timeS
                                  : selectedOption1 === "zh-CN"
                                    ? a.zh_timeS
                                    : ""}
                          &nbsp;&nbsp;&nbsp;
                          {selectedOption1 === "th"
                            ? a.keepS
                            : selectedOption1 === "my"
                              ? a.my_keepS
                              : selectedOption1 === "lo"
                                ? a.lo_keepS
                                : selectedOption1 === "en"
                                  ? a.en_keepS
                                  : selectedOption1 === "zh-CN"
                                    ? a.zh_keepS
                                    : ""}
                        </div>
                      </div>
                      {/**   <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.keepS}</div>*/}

                      <div
                        className="d-flex"
                        style={{
                          fontFamily: "kanit",
                          fontSize: 11,
                          textAlign: "start",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        {/**     {a.remarkS}*/}
                        <div
                          className="d-flex"
                          style={{
                            fontFamily: "kanit",
                            fontSize: 11,
                            textAlign: "start",
                            marginLeft: 5,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "100%",
                          }}
                        >
                          หมายเหตุ :{" "}
                          {selectedOption1 === "th"
                            ? a.remarkS
                            : selectedOption1 === "my"
                              ? a.my_remarkS
                              : selectedOption1 === "lo"
                                ? a.lo_remarkS
                                : selectedOption1 === "en"
                                  ? a.en_remarkS
                                  : selectedOption1 === "zh-CN"
                                    ? a.zh_remarkS
                                    : "."}
                        </div>
                      </div>
                      <div
                        className="row mt-1"
                        style={{
                          fontFamily: "kanit",
                          fontSize: 11,
                          textAlign: "start",
                          marginLeft: 5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        เภสัชกร :{" "}
                        {postsEmp
                          .filter((a: any) => a.position === "เภสัชกรประจำร้าน")
                          .map((b: any) => b.name)}
                      </div>
                    </div>

                    <div className="col-3" style={{ marginTop: 60 }}>
                      <div
                        style={{
                          height: "auto",
                          margin: "0 auto",
                          maxWidth: 40,
                          width: "100%",
                        }}
                      >
                        <QRCode
                          size={256}
                          style={{
                            height: "auto",
                            maxWidth: "100%",
                            width: "100%",
                          }}
                          value={a.barcode}
                          viewBox={"0 0 256 256"}
                        />
                      </div>
                      <div
                        style={{
                          fontFamily: "kanit",
                          fontSize: 8,
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        {a.barcode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>,
    );

    try {
      await printSilent({
        content: content,
        printerName: selectedPrinter_rc,
      });
      toast.success(
        <div style={{ fontFamily: "Kanit", fontSize: 15 }}>สถานะ</div>,
        {
          description: (
            <div style={{ fontFamily: "Kanit", fontSize: 20 }}>
              {" "}
              ส่งพิมพ์เรียบร้อย
            </div>
          ),
          duration: 3000,
        },
      );
    } catch (error) {
      console.error("Printing failed:", error);
      alert("Printing failed");
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    print: async (iframe: HTMLIFrameElement) => {
      const html = iframe.contentDocument?.documentElement.outerHTML;

      if (html) {
        await iframe.contentWindow?.print();
      }
    },
  });

  // ตั้งค่่าฉลากยา
  function SetLabel() {
    const [listS, setListS] = useState<any[]>([]); // กำหนด Type ให้เป็น Array ของอะไรบางอย่าง
    const [listL, setlistL] = useState(list);

    const handlelabel = () => {
      (list.length > 0 ? onOpen() : "",
        localStorage.setItem("lg", "th"),
        setListS(list));
    };

    useEffect(() => {
      // ✅ บอก type ให้ TypeScript ชัดเจน
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        switch (key) {
          case "f11":
            event.preventDefault();
            handlelabel();
            break;
        }
      };

      // ✅ ระบุ type ของ listener ให้ตรง
      window.addEventListener("keydown", handleKeyDown as EventListener);

      return () => {
        window.removeEventListener("keydown", handleKeyDown as EventListener);
      };
    }, [handlelabel /*, handlePrint, handleClear*/]);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [selectedOption1, setSelectedOption1] = useState("th"); // Initial selected value
    //  const listS=JSON.parse(localStorage.getItem("listS") || "") ===undefined?[]:JSON.parse(localStorage.getItem("listS") || "")

    // เก็บ translations แยกจาก list เพื่อไม่ให้ modal ปิด
    const translationsRef = React.useRef<Record<string, string>>({});

    // Helper function เพื่อดึงข้อความที่แปลแล้วหรือข้อความเดิม
    const getTranslatedText = (item: any, field: string, lang: string) => {
      const langPrefix = lang === "zh-CN" ? "zh" : lang;
      // ตรวจสอบจาก item ก่อน
      if (item[`${langPrefix}_${field}`]) return item[`${langPrefix}_${field}`];
      // ตรวจสอบจาก translationsRef
      const key = `${item.id}_${langPrefix}_${field}`;
      if (translationsRef.current[key]) return translationsRef.current[key];
      // ถ้าเป็นภาษาไทยหรือไม่มีการแปล ให้ return ข้อความไทย
      return lang === "th" ? item[field] : item[field];
    };

    const handleOptionChange2 = (e: any) => {
      const lang = e.target.value;
      localStorage.setItem("lg", lang);
      setSelectedOption1(lang);

      // ถ้าเลือกภาษาอื่นที่ไม่ใช่ไทย ให้ตรวจสอบและแปลอัตโนมัติ
      if (lang !== "th") {
        const langMap: Record<string, string> = {
          my: "my",
          lo: "lo",
          en: "en",
          "zh-CN": "zh",
        };
        const targetLang = langMap[lang] || lang;
        const langPrefix = lang === "zh-CN" ? "zh" : lang;

        // รวบรวมข้อความทั้งหมดที่ต้องแปล
        const textsToTranslate: string[] = [];
        const textMapping: { itemId: any; field: string; textIndex: number }[] =
          [];

        listL.forEach((item: any) => {
          const fields = [
            "indicatorlistS",
            "useS",
            "timeS",
            "timeuseS",
            "keepS",
            "remarkS",
          ];
          fields.forEach((field) => {
            const key = `${item.id}_${langPrefix}_${field}`;
            // ตรวจสอบว่ายังไม่มีการแปลทั้งใน item และใน ref
            if (
              item[field] &&
              !item[`${langPrefix}_${field}`] &&
              !translationsRef.current[key]
            ) {
              textMapping.push({
                itemId: item.id,
                field,
                textIndex: textsToTranslate.length,
              });
              textsToTranslate.push(item[field]);
            }
          });
        });

        if (textsToTranslate.length > 0) {
          // ส่งข้อความทั้งหมดใน request เดียว (batch) เพื่อความเร็ว
          fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              texts: textsToTranslate,
              targets: [targetLang],
            }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.batchResults) {
                const newListL = [...listL];
                let hasChanges = false;
                data.batchResults.forEach((result: any) => {
                  const mapping = textMapping[result.index];
                  if (mapping && result.translatedText) {
                    const key = `${mapping.itemId}_${langPrefix}_${mapping.field}`;
                    translationsRef.current[key] = result.translatedText;
                    const itemIndex = newListL.findIndex(
                      (item: any) => item.id === mapping.itemId,
                    );
                    if (itemIndex !== -1) {
                      newListL[itemIndex] = {
                        ...newListL[itemIndex],
                        [`${langPrefix}_${mapping.field}`]:
                          result.translatedText,
                      };
                      hasChanges = true;
                    }
                  }
                });
                if (hasChanges) {
                  setlistL(newListL);
                  localStorage.setItem("listS", JSON.stringify(newListL));
                }
              }
            })
            .catch((err) => console.error("Translation error:", err));
        }
      }
    };

    const [showA, setShowA] = useState(false);
    const [showB, setShowB] = useState(false);
    const [showC, setShowC] = useState(false);
    const [showD, setShowD] = useState(false);

    const toggleShowA = () => setShowA(!showA);
    const toggleShowB = () => setShowB(!showB);
    const toggleShowC = () => setShowC(!showC);
    const toggleShowD = () => setShowD(!showD);

    const [num, setNum] = useState(0);
    const [code_pro, setId_pro] = useState("");
    const [id_Name, setName_pro] = useState("");

    const [windiE, setIndiE] = useState("");
    //Indicator
    const IndiShow = () => {
      const [indiE, wsetIndiE] = useState(windiE);
      const IndiInput = (e: any) => {
        wsetIndiE(e.target.value);
      };
      return (
        <Toast show={showA} onClose={toggleShowA}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong
              className="me-auto"
              style={{
                fontFamily: "Kanit",
                width: "100%",
                textAlign: "start",
                fontSize: 10,
              }}
            >
              แก้ไข ข้อบ่งใช้ == {id_Name}
            </strong>
          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={indiE}
                onChange={IndiInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{
                  fontFamily: "Kanit_B",
                  width: "70%",
                  textAlign: "start",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  (setlistL(
                    listL.map((task: any) =>
                      task.code_product === code_pro
                        ? { ...task, indicatorlistS: String(indiE) }
                        : task,
                    ),
                  ),
                    setShowA(!showA));
                }}
                style={{
                  fontFamily: "Kanit",
                  width: "20%",
                  textAlign: "center",
                  fontSize: 12,
                  marginLeft: 5,
                }}
              >
                ตกลง
              </button>
            </div>
          </Toast.Body>
        </Toast>
      );
    };

    const [wuseE, setuseE] = useState("");
    //Use
    const UseShow = () => {
      const [useE, wsetuseE] = useState(wuseE);
      const useInput = (e: any) => {
        wsetuseE(e.target.value);
      };
      return (
        <Toast show={showB} onClose={toggleShowB}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong
              className="me-auto"
              style={{
                fontFamily: "Kanit",
                width: "100%",
                textAlign: "start",
                fontSize: 10,
              }}
            >
              แก้ไข วิธีและช่วงเวลา == {id_Name}
            </strong>
          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={useE}
                onChange={useInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{
                  fontFamily: "Kanit_B",
                  width: "70%",
                  textAlign: "start",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  (setlistL(
                    listL.map((task: any) =>
                      task.code_product === code_pro
                        ? { ...task, useS: String(useE), timeuseS: String("") }
                        : task,
                    ),
                  ),
                    setShowB(!showB));
                }}
                style={{
                  fontFamily: "Kanit",
                  width: "20%",
                  textAlign: "center",
                  fontSize: 12,
                  marginLeft: 5,
                }}
              >
                ตกลง
              </button>
            </div>
          </Toast.Body>
        </Toast>
      );
    };

    const [wtimeE, settimeE] = useState("");
    //timeS
    const TimeShow = () => {
      const [timeE, wsettimeE] = useState(wtimeE);
      const timeInput = (e: any) => {
        wsettimeE(e.target.value);
      };

      return (
        <Toast show={showC} onClose={toggleShowC}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong
              className="me-auto"
              style={{
                fontFamily: "Kanit",
                width: "100%",
                textAlign: "start",
                fontSize: 10,
              }}
            >
              แก้ไข ช่วงเวลาและวิธีเก็บ == {id_Name}
            </strong>
          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={timeE}
                onChange={timeInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{
                  fontFamily: "Kanit_B",
                  width: "70%",
                  textAlign: "start",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  (setlistL(
                    listL.map((task: any) =>
                      task.code_product === code_pro
                        ? { ...task, timeS: String(timeE), keepS: String("") }
                        : task,
                    ),
                  ),
                    setShowC(!showC));
                }}
                style={{
                  fontFamily: "Kanit",
                  width: "20%",
                  textAlign: "center",
                  fontSize: 12,
                  marginLeft: 5,
                }}
              >
                ตกลง
              </button>
            </div>
          </Toast.Body>
        </Toast>
      );
    };

    const [remarkE, setremarkE] = useState("");
    //RemarkS
    const RemarkShow = () => {
      const [wremarkE, wsetremarkE] = useState(remarkE);
      const remarkInput = (e: any) => {
        wsetremarkE(e.target.value);
      };
      return (
        <Toast show={showD} onClose={toggleShowD}>
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
            <strong
              className="me-auto"
              style={{
                fontFamily: "Kanit",
                width: "100%",
                textAlign: "start",
                fontSize: 10,
              }}
            >
              แก้ไข หมายเหตุ == {id_Name}
            </strong>
          </Toast.Header>
          <Toast.Body>
            <div className="row" style={{ justifyContent: "center" }}>
              <input
                value={wremarkE}
                onChange={remarkInput}
                className="form-control form-control-sm "
                placeholder=""
                style={{
                  fontFamily: "Kanit_B",
                  width: "70%",
                  textAlign: "start",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  (setlistL(
                    listL.map((task: any) =>
                      task.code_product === code_pro
                        ? { ...task, remarkS: String(wremarkE) }
                        : task,
                    ),
                  ),
                    setShowD(!showD));
                }}
                style={{
                  fontFamily: "Kanit",
                  width: "20%",
                  textAlign: "center",
                  fontSize: 12,
                  marginLeft: 5,
                }}
              >
                ตกลง
              </button>
            </div>
          </Toast.Body>
        </Toast>
      );
    };

    return (
      <div className={styles.afterpayContainer}>
        {/**    <button
          disabled={list.length < 1 ? true : false}
          className={styles.printLabelButton}
          style={{ width: "100%" }}
          onClick={handlelabel}
        >
          🏷️ พิมพ์ฉลากสินค้า (F11)
        </button>
    */}
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          scrollBehavior={"inside"}
        >
          <ModalContent
            className=" shadow-sm rounded rounded-2 border border"
            style={{
              backgroundColor: "rgba(255, 255, 255, 1)",
              width: "35vw",
              height: "95%",
            }}
          >
            {(onClose) => (
              <>
                <ModalHeader
                  style={{
                    height: 80,
                    backgroundColor: "rgba(241, 241, 241, 1)",
                  }}
                >
                  <div className="col">
                    <div
                      className="row"
                      style={{
                        width: "100%",
                        height: 5,
                        fontSize: 14,
                        fontFamily: "Kanit_B",
                      }}
                    >
                      <div className="col-auto">เลือกภาษา :</div>

                      <>
                        <div className="col">
                          <label
                            style={{
                              fontFamily: "Kanit",
                              fontSize: 15,
                              width: 70,
                            }}
                          >
                            <input
                              type="radio"
                              name="th" // Same name for all radio buttons in the group
                              value="th"
                              checked={selectedOption1 === "th"} // Controlled by state
                              onChange={handleOptionChange2}
                              style={{ marginRight: 10, fontFamily: "Kanit" }}
                            />
                            ไทย
                          </label>

                          <label
                            style={{
                              fontFamily: "Kanit",
                              fontSize: 15,
                              width: 70,
                            }}
                          >
                            <input
                              type="radio"
                              name="my" // Same name for all radio buttons in the group
                              value="my"
                              checked={selectedOption1 === "my"} // Controlled by state
                              onChange={handleOptionChange2}
                              style={{ marginRight: 10, fontFamily: "Kanit" }}
                            />
                            พม่า
                          </label>

                          <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                            <input
                              type="radio"
                              name="lo"
                              value="lo"
                              checked={selectedOption1 === "lo"}
                              onChange={handleOptionChange2}
                              style={{
                                marginLeft: 20,
                                marginRight: 10,
                                fontFamily: "Kanit",
                              }}
                            />
                            ลาว
                          </label>

                          <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                            <input
                              type="radio"
                              name="en"
                              value="en"
                              checked={selectedOption1 === "en"}
                              onChange={handleOptionChange2}
                              style={{
                                marginLeft: 20,
                                marginRight: 10,
                                fontFamily: "Kanit",
                              }}
                            />
                            อังกฤษ
                          </label>

                          <label style={{ fontFamily: "Kanit", fontSize: 15 }}>
                            <input
                              type="radio"
                              name="zh-CN"
                              value="zh-CN"
                              checked={selectedOption1 === "zh-CN"}
                              onChange={handleOptionChange2}
                              style={{
                                marginLeft: 20,
                                marginRight: 10,
                                fontFamily: "Kanit",
                              }}
                            />
                            จีน
                          </label>
                        </div>

                        <div className="col-auto">
                          <button
                            className="btn btn-primary"
                            onClick={modalPS.onOpen}
                            style={{
                              fontFamily: "Kanit",
                              fontSize: 13,
                              height: 30,
                              padding: "2px 10px",
                              marginTop: -5,
                            }}
                          >
                            ตั้งค่าเภสัชกร
                          </button>
                        </div>
                      </>
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div className="col">
                    <div className="col" style={{ textAlign: "center" }}>
                      <Table className="table" size="sm">
                        <tbody className="table-group-divider">
                          <tr className="">
                            <th
                              scope="row"
                              className={styles.bodydetailTable_Re1}
                              style={{ width: "15%" }}
                            >
                              <div
                                className="row mt-1"
                                style={{ justifyContent: "center" }}
                                ref={contentRef}
                              >
                                {listL
                                  .filter((q: any) => q.label === true)
                                  .map((a: any) => (
                                    <div
                                      key={a.id}
                                      id="selcet-print"
                                      className="col-9 rounded border border-2 shadow shadow-sm"
                                      style={{
                                        height: 200,
                                        backgroundColor: "white",
                                      }}
                                    >
                                      <div className="row">
                                        <div
                                          className="row"
                                          style={{ height: 60 }}
                                        >
                                          {allS === false ? (
                                            <div className="row">
                                              {logoS === true ? (
                                                <div className="col-2 ">
                                                  <div
                                                    style={{
                                                      height: "auto",
                                                      margin: "0 auto",
                                                      maxWidth: 45,
                                                      width: 45,
                                                      marginTop: 5,
                                                      justifyItems: "center",
                                                      marginLeft: 5,
                                                    }}
                                                  >
                                                    <img
                                                      alt={""}
                                                      src={String(uploadedUrl)}
                                                      width={55}
                                                      height={50}
                                                    />
                                                  </div>
                                                </div>
                                              ) : (
                                                ""
                                              )}
                                              <div
                                                className={
                                                  logoS === true
                                                    ? "col-8"
                                                    : "col-9"
                                                }
                                                style={{
                                                  marginLeft:
                                                    logoS === true ? 10 : 35,
                                                }}
                                              >
                                                <div className="row">
                                                  <div
                                                    className={
                                                      logoS === true
                                                        ? "col-8"
                                                        : "col-9"
                                                    }
                                                    style={{
                                                      fontFamily: "kanit_B",
                                                      fontSize: 16,
                                                      textAlign: "start",
                                                      width: "100%",
                                                    }}
                                                  >
                                                    {storeS}
                                                  </div>
                                                </div>
                                                <div
                                                  style={{
                                                    fontFamily: "kanit",
                                                    fontSize: 9,
                                                    width: 200,
                                                  }}
                                                >
                                                  {addressS}
                                                  {" โทร : "} {telS}
                                                </div>
                                                <div
                                                  className="row rounded  shadow shadow mb-2"
                                                  style={{
                                                    borderColor: "black",
                                                    fontFamily: "kanit",
                                                    height: 2,
                                                    fontSize: 10,
                                                    backgroundColor: "black",
                                                  }}
                                                ></div>
                                              </div>
                                              {lineS === true ? (
                                                <div className="col-1 mt-1">
                                                  <div
                                                    style={{
                                                      height: "auto",
                                                      margin: "0 auto",
                                                      maxWidth: 45,
                                                      width: 45,
                                                      marginLeft: 10,
                                                    }}
                                                  >
                                                    <img
                                                      alt={""}
                                                      src={String(uploadedUrl1)}
                                                      width={60}
                                                      height={60}
                                                    />
                                                    <div
                                                      style={{
                                                        fontFamily: "kanit",
                                                        fontSize: 8,
                                                        textAlign: "center",
                                                      }}
                                                    >
                                                      Line ร้านค้า
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                ""
                                              )}
                                            </div>
                                          ) : (
                                            ""
                                          )}
                                        </div>

                                        <div>
                                          {allS === true ? (
                                            <div
                                              className="row "
                                              style={{
                                                marginLeft: 8,
                                                backgroundColor: "black",
                                                width: "95%",
                                                borderColor: "black",
                                                height: 2,
                                              }}
                                            ></div>
                                          ) : (
                                            ""
                                          )}
                                          <div className="row mt-1">
                                            <div
                                              className="col-auto me-auto "
                                              style={{
                                                fontFamily: "kanit",
                                                fontSize: 10,
                                                textAlign: "start",
                                                marginLeft: 5,
                                              }}
                                            >
                                              {name_cus === ""
                                                ? "ลูกค้าทั่วไป"
                                                : name_cus}
                                            </div>
                                            <div
                                              className="col-auto"
                                              style={{
                                                fontFamily: "kanit",
                                                fontSize: 10,
                                                textAlign: "end",
                                                marginRight: 10,
                                              }}
                                            >
                                              {new Date().toLocaleDateString(
                                                "es-US",
                                                {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                                },
                                              )}
                                            </div>
                                          </div>

                                          <div
                                            className="row"
                                            style={{ height: "20vh" }}
                                          >
                                            <div className="col-8 me-auto">
                                              <div
                                                className="d-flex"
                                                style={{
                                                  fontFamily: "kanit",
                                                  fontSize: 13,
                                                  textAlign: "start",
                                                  marginLeft: 5,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  width: 350,
                                                }}
                                              >
                                                {a.name_product}
                                              </div>
                                              <button
                                                className="d-flex"
                                                onClick={() => {
                                                  (setShowA(!showA),
                                                    setId_pro(a.code_product));
                                                  setName_pro(a.name_product);
                                                  setNum(1);
                                                  setIndiE(
                                                    selectedOption1 === "th"
                                                      ? a.indicatorlistS
                                                      : selectedOption1 === "my"
                                                        ? a.my_indicatorlistS
                                                        : selectedOption1 ===
                                                          "lo"
                                                          ? a.lo_indicatorlistS
                                                          : selectedOption1 ===
                                                            "en"
                                                            ? a.en_indicatorlistS
                                                            : selectedOption1 ===
                                                              "zh-CN"
                                                              ? a.zh_indicatorlistS
                                                              : "",
                                                  );
                                                }}
                                                style={{
                                                  fontFamily: "kanit",
                                                  fontSize: 13,
                                                  textAlign: "start",
                                                  marginLeft: 5,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  width: 350,
                                                }}
                                              >
                                                {selectedOption1 === "th"
                                                  ? a.indicatorlistS
                                                  : selectedOption1 === "my"
                                                    ? a.my_indicatorlistS
                                                    : selectedOption1 === "lo"
                                                      ? a.lo_indicatorlistS
                                                      : selectedOption1 === "en"
                                                        ? a.en_indicatorlistS
                                                        : selectedOption1 ===
                                                          "zh-CN"
                                                          ? a.zh_indicatorlistS
                                                          : ""}
                                              </button>

                                              <div
                                                className="d-flex"
                                                style={{
                                                  fontFamily: "kanit",
                                                  fontSize: 11,
                                                  textAlign: "start",
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  width: 350,
                                                }}
                                              >
                                                <button
                                                  className="d-flex"
                                                  onClick={() => {
                                                    (setShowB(!showB),
                                                      setId_pro(
                                                        a.code_product,
                                                      ));
                                                    setName_pro(a.name_product);
                                                    setNum(2);
                                                    setuseE(
                                                      selectedOption1 === "th"
                                                        ? a.useS +
                                                        "  " +
                                                        a.timeuseS
                                                        : selectedOption1 ===
                                                          "my"
                                                          ? a.my_useS +
                                                          "  " +
                                                          a.my_timeuseS
                                                          : selectedOption1 ===
                                                            "lo"
                                                            ? a.lo_useS +
                                                            "  " +
                                                            a.lo_timeuseS
                                                            : selectedOption1 ===
                                                              "en"
                                                              ? a.en_useS +
                                                              "  " +
                                                              a.en_timeuseS
                                                              : selectedOption1 ===
                                                                "zh-CN"
                                                                ? a.zh_useS +
                                                                "  " +
                                                                a.zh_timeuseS
                                                                : "",
                                                    );
                                                  }}
                                                  style={{
                                                    fontFamily: "kanit",
                                                    fontSize: 11,
                                                    textAlign: "start",
                                                    marginLeft: 5,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    width: 350,
                                                  }}
                                                >
                                                  {selectedOption1 === "th"
                                                    ? a.useS
                                                    : selectedOption1 === "my"
                                                      ? a.my_useS
                                                      : selectedOption1 === "lo"
                                                        ? a.lo_useS
                                                        : selectedOption1 ===
                                                          "en"
                                                          ? a.en_useS
                                                          : selectedOption1 ===
                                                            "zh-CN"
                                                            ? a.zh_useS
                                                            : ""}
                                                  &nbsp;&nbsp;&nbsp;
                                                  {selectedOption1 === "th"
                                                    ? a.timeuseS
                                                    : selectedOption1 === "my"
                                                      ? a.my_timeuseS
                                                      : selectedOption1 === "lo"
                                                        ? a.lo_timeuseS
                                                        : selectedOption1 ===
                                                          "en"
                                                          ? a.en_timeuseS
                                                          : selectedOption1 ===
                                                            "zh-CN"
                                                            ? a.zh_timeuseS
                                                            : ""}
                                                </button>
                                              </div>

                                              {/**     <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.timeuseS}</div>*/}

                                              <div
                                                className="d-flex"
                                                style={{
                                                  fontFamily: "kanit",
                                                  fontSize: 11,
                                                  textAlign: "start",
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  width: 350,
                                                }}
                                              >
                                                {/**  {a.timeS} */}
                                                <button
                                                  className="d-flex"
                                                  onClick={() => {
                                                    (setShowC(!showC),
                                                      setId_pro(
                                                        a.code_product,
                                                      ));
                                                    setName_pro(a.name_product);
                                                    setNum(3);
                                                    settimeE(
                                                      selectedOption1 === "th"
                                                        ? a.timeS +
                                                        "  " +
                                                        a.keepS
                                                        : selectedOption1 ===
                                                          "my"
                                                          ? a.my_timeS +
                                                          "  " +
                                                          a.my_keepS
                                                          : selectedOption1 ===
                                                            "lo"
                                                            ? a.lo_timeS +
                                                            "  " +
                                                            a.lo_keepS
                                                            : selectedOption1 ===
                                                              "en"
                                                              ? a.en_timeS +
                                                              "  " +
                                                              a.en_keepS
                                                              : selectedOption1 ===
                                                                "zh-CN"
                                                                ? a.zh_timeS +
                                                                "  " +
                                                                a.zh_keepS
                                                                : "",
                                                    );
                                                  }}
                                                  style={{
                                                    fontFamily: "kanit",
                                                    fontSize: 11,
                                                    textAlign: "start",
                                                    marginLeft: 5,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    width: 350,
                                                  }}
                                                >
                                                  {selectedOption1 === "th"
                                                    ? a.timeS
                                                    : selectedOption1 === "my"
                                                      ? a.my_timeS
                                                      : selectedOption1 === "lo"
                                                        ? a.lo_timeS
                                                        : selectedOption1 ===
                                                          "en"
                                                          ? a.en_timeS
                                                          : selectedOption1 ===
                                                            "zh-CN"
                                                            ? a.zh_timeS
                                                            : ""}
                                                  &nbsp;&nbsp;&nbsp;
                                                  {selectedOption1 === "th"
                                                    ? a.keepS
                                                    : selectedOption1 === "my"
                                                      ? a.my_keepS
                                                      : selectedOption1 === "lo"
                                                        ? a.lo_keepS
                                                        : selectedOption1 ===
                                                          "en"
                                                          ? a.en_keepS
                                                          : selectedOption1 ===
                                                            "zh-CN"
                                                            ? a.zh_keepS
                                                            : ""}
                                                </button>
                                              </div>
                                              {/**   <div className='col' style={{fontFamily:"kanit",fontSize:11,textAlign:"start",marginLeft:5,whiteSpace:'nowrap',overflow:"hidden",textOverflow:"ellipsis",width:"9vw"}}>{a.keepS}</div>*/}

                                              <div
                                                className="d-flex"
                                                style={{
                                                  fontFamily: "kanit",
                                                  fontSize: 11,
                                                  textAlign: "start",
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  width: 250,
                                                }}
                                              >
                                                {/**     {a.remarkS}*/}
                                                <button
                                                  className="d-flex"
                                                  onClick={() => {
                                                    (setShowD(!showD),
                                                      setId_pro(
                                                        a.code_product,
                                                      ));
                                                    setName_pro(a.name_product);
                                                    setNum(4);
                                                    setremarkE(
                                                      selectedOption1 === "th"
                                                        ? a.remarkS
                                                        : selectedOption1 ===
                                                          "my"
                                                          ? a.my_remarkS
                                                          : selectedOption1 ===
                                                            "lo"
                                                            ? a.lo_remarkS
                                                            : selectedOption1 ===
                                                              "en"
                                                              ? a.en_remarkS
                                                              : selectedOption1 ===
                                                                "zh-CN"
                                                                ? a.zh_remarkS
                                                                : "",
                                                    );
                                                  }}
                                                  style={{
                                                    fontFamily: "kanit",
                                                    fontSize: 11,
                                                    textAlign: "start",
                                                    marginLeft: 5,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    width: 250,
                                                  }}
                                                >
                                                  หมายเหตุ :{" "}
                                                  {selectedOption1 === "th"
                                                    ? a.remarkS
                                                    : selectedOption1 === "my"
                                                      ? a.my_remarkS
                                                      : selectedOption1 === "lo"
                                                        ? a.lo_remarkS
                                                        : selectedOption1 ===
                                                          "en"
                                                          ? a.en_remarkS
                                                          : selectedOption1 ===
                                                            "zh-CN"
                                                            ? a.zh_remarkS
                                                            : "."}
                                                </button>
                                              </div>
                                              <div
                                                className="row mt-1"
                                                style={{
                                                  fontFamily: "kanit",
                                                  fontSize: 11,
                                                  textAlign: "start",
                                                  marginLeft: 5,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  width: 200,
                                                }}
                                              >
                                                เภสัชกร : {selectedPS}
                                              </div>
                                            </div>

                                            <div
                                              className="col-3"
                                              style={{ marginTop: 60 }}
                                            >
                                              <div
                                                style={{
                                                  height: "auto",
                                                  margin: "0 auto",
                                                  maxWidth: 40,
                                                  width: "100%",
                                                }}
                                              >
                                                <QRCode
                                                  size={256}
                                                  style={{
                                                    height: "auto",
                                                    maxWidth: "100%",
                                                    width: "100%",
                                                  }}
                                                  value={a.barcode}
                                                  viewBox={`0 0 256 256`}
                                                />
                                              </div>
                                              <div
                                                style={{
                                                  fontFamily: "kanit",
                                                  fontSize: 8,
                                                  textAlign: "left",
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  width: 95,
                                                }}
                                              >
                                                {a.barcode}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </th>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </ModalBody>

                <ModalFooter
                  className="d-flex border "
                  style={{
                    height:
                      showA === true ||
                        showB === true ||
                        showC === true ||
                        showD === true
                        ? 150
                        : 70,
                    backgroundColor: "rgba(241, 241, 241, 1)",
                  }}
                >
                  <button
                    className="btn btn-success"
                    style={{
                      width: 80,
                      height: 35,
                      fontSize: 15,
                      fontFamily: "Kanit",
                    }}
                    onClick={reactToPrintFn}
                  >
                    Print
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{
                      width: 80,
                      height: 35,
                      fontSize: 15,
                      fontFamily: "Kanit",
                    }}
                    onClick={() => onClose()}
                  >
                    Close
                  </button>

                  {num === 1 ? (
                    <IndiShow />
                  ) : num === 2 ? (
                    <UseShow />
                  ) : num === 3 ? (
                    <TimeShow />
                  ) : num === 4 ? (
                    <RemarkShow />
                  ) : (
                    ""
                  )}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Pharmacist Selection Modal */}
        <Modal
          isOpen={modalPS.isOpen}
          onOpenChange={modalPS.onOpenChange}
          scrollBehavior={"inside"}
          size="md"
        >
          <ModalContent
            className="shadow-sm rounded rounded-2 border border"
            style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
          >
            {(onClose) => (
              <>
                <ModalHeader
                  style={{
                    height: 60,
                    backgroundColor: "rgba(241, 241, 241, 1)",
                  }}
                >
                  <div style={{ fontFamily: "Kanit_B", fontSize: 18 }}>
                    เลือกเภสัชกร
                  </div>
                </ModalHeader>
                <ModalBody>
                  <Table className="table" size="sm">
                    <thead>
                      <tr>
                        <th style={{ fontFamily: "Kanit_B" }}>ชื่อ-นามสกุล</th>
                        <th style={{ fontFamily: "Kanit_B" }}>ตำแหน่ง</th>
                        <th
                          style={{ fontFamily: "Kanit_B", textAlign: "center" }}
                        >
                          เลือก
                        </th>
                      </tr>
                    </thead>
                    <tbody className="table-group-divider">
                      {postsEmp.map((emp: any) => (
                        <tr key={emp.id}>
                          <td style={{ fontFamily: "Kanit", fontSize: 14 }}>
                            {emp.name}
                          </td>
                          <td style={{ fontFamily: "Kanit", fontSize: 14 }}>
                            {emp.position}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn btn-outline-success btn-sm"
                              style={{ fontFamily: "Kanit", fontSize: 12 }}
                              onClick={() => {
                                localStorage.setItem("ps", String(emp.name));
                                setSelectedPS(String(emp.name));
                                onClose();
                              }}
                            >
                              เลือก
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </ModalBody>
                <ModalFooter
                  style={{ backgroundColor: "rgba(241, 241, 241, 1)" }}
                >
                  <button
                    className="btn btn-secondary"
                    style={{
                      width: 80,
                      height: 35,
                      fontSize: 15,
                      fontFamily: "Kanit",
                    }}
                    onClick={onClose}
                  >
                    ปิด
                  </button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    );
  }

  const [drugs, setdrugs] = useState([]);
  const [mu, setmu] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setdrugs(JSON.parse(localStorage.getItem("dg") || "[]"));
      setmu(localStorage.getItem("mu") || "");
    }, 1000);

    //setdrugs(JSON.parse(localStorage.getItem("dg")||""))
  }, [Number(id_cus), Number(idF)]);

  //*************check drug interaction**************************************************** */

  const result = interaction.map((pair: any) => {
    const foundA = list.some((item: any) => item.fixname === pair.fixname1);
    const foundB = list.some((item: any) => item.fixname === pair.fixname2);
    const found = foundA && foundB;

    return {
      ...pair,
      found,
    };
  });

  const foundPairs = result.filter((r) => r.found);

  return (
    <div
      className="d-flex flex-column g-1"
      style={{ paddingLeft: 5 }}
      id="after-print"
    >
      <div className="w-100 mb-3">
        <div className="row-4 shadow-sm rounded border border-success  "></div>

        <div className="container-fluid ">
          {/*ตารางรายการ sale*/}
          <div className="container" style={{ padding: 5 }}>
            <div className="row  mb-1">
              {savemu === "1" ? (
                <div className={styles.mobileSalesList}>
                  {list.map((item, index) => (
                    <div
                      key={item.id}
                      className={`${styles.mobileSaleCard} ${index % 2 === 0 ? styles.mobileSaleCardEven : styles.mobileSaleCardOdd}`}
                      onClick={() => {
                        setcodeproductS(item.code_product);
                        setcostS(String(item.cost));
                      }}
                    >
                      {/* Card Header - Product Info */}
                      <div className={styles.mobileCardHeader}>
                        <div className={styles.mobileProductImage}>
                          {item.pic === "" || item.pic == null ? (
                            <div className={styles.mobileNoImage}>📦</div>
                          ) : (
                            <img src={item.pic} alt="" className={styles.mobileProductImg} />
                          )}
                        </div>
                        <div className={styles.mobileProductInfo}>
                          <div className={styles.mobileProductCode}>{item.code_product}</div>
                          <div className={styles.mobileProductName}>{item.name_product}</div>
                          {(item.nme_customer || item.name_customer) && (
                            <div className={styles.mobileCustomerName}>
                              {item.nme_customer || item.name_customer}
                            </div>
                          )}
                          {(() => {
                            const drugTypes = ["ขย.10", "ขย.11", "ขย.12", "ขย.13", "ข.ย.10", "ข.ย.11", "ข.ย.12", "ข.ย.13", "ขย.10 และ ขย.11", "ขย.10 และ ขย.12", "ขย.11 และ ขย.12"];
                            const prod = dataProduct.find((p: any) => p.code === item.code_product);
                            const matchType = prod && drugTypes.includes(prod.type) ? prod.type : null;
                            const matchSubtype = prod && drugTypes.includes(prod.subtype) ? prod.subtype : null;
                            const label = matchType || matchSubtype;
                            return label ? <div className={styles.mobileDrugLabel}>{label}</div> : null;
                          })()}
                        </div>
                        <div className={styles.mobileBadges}>
                          {(foundPairs.filter((d: any) => d.fixname2 === String(item.fixname))[0] ||
                            foundPairs.filter((d: any) => d.fixname1 === String(item.fixname))[0]) && (
                              <span className={styles.mobileInteractionBadge}>⚠️</span>
                            )}
                          {drugs.filter((w: any) => w.drugallergy === item.fixname).length > 0 && (
                            <span className={styles.mobileAllergyBadge}>🚫</span>
                          )}
                        </div>
                      </div>

                      {/* Card Body - Details */}
                      <div className={styles.mobileCardBody}>
                        <div className={styles.mobileDetailRow}>
                          <div className={styles.mobileDetailItem}>
                            <label>จำนวน</label>
                            <QtyInput item={item} changepay={changepay} onConfirm={cut_lot_Price_manual_inline} />
                          </div>
                          <div className={styles.mobileDetailItem}>
                            <label>หน่วย</label>
                            <button
                              disabled={changepay === "1"}
                              className={styles.mobileUnitButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchUnitConversions(item.code_product, item);
                              }}
                            >
                              {item.unit}
                            </button>
                          </div>
                          <div className={styles.mobileDetailItem}>
                            <label>ย่อย</label>
                            <span className={styles.mobileSubQty}>
                              {(item.subQty || 1) * item.qty} {item.subUnit || item.unit}
                            </span>
                          </div>
                          <div className={styles.mobileDetailItem}>
                            <label>คงเหลือ</label>
                            <span className={`${styles.mobileBalance} ${getProductBalance(item.id_product) < 1
                              ? styles.mobileBalanceLow
                              : getProductBalance(item.id_product) <= 2
                                ? styles.mobileBalanceMedium
                                : styles.mobileBalanceNormal
                              }`}>
                              {getProductBalance(item.id_product)}
                            </span>
                          </div>
                        </div>

                        <div className={styles.mobilePriceRow}>
                          <div className={styles.mobilePriceItem}>
                            <label>ราคา</label>
                            <span className={styles.mobilePrice}>{item.price}</span>
                          </div>
                          <div className={styles.mobilePriceItem}>
                            <label>รวม</label>
                            <span className={styles.mobileTotal}>{item.total}</span>
                          </div>
                        </div>

                        {changepay !== "1" && (
                          <div className={styles.mobileCardActions}>
                            <label className={styles.mobileLabelCheckbox}>
                              <input
                                type="checkbox"
                                checked={item.label}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  setIsChecked(e.target.checked);
                                  setList(list.map((task) =>
                                    task.id === item.id ? { ...task, label: e.target.checked } : task
                                  ));
                                }}
                              />
                              <span>ฉลาก</span>
                            </label>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                                localStorage.setItem("itemlist", String(list.length));
                              }}
                              type="button"
                              className={styles.mobileDeleteButton}
                            >
                              🗑️ ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Modal isOpen={modal2.isOpen} onOpenChange={modal2.onOpenChange} scrollBehavior={"inside"}>
                    <ModalContent
                      className="shadow-sm rounded rounded-2 border border"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 1)",
                        width: "95vw",
                        maxWidth: 500,
                        height: "auto",
                        paddingBottom: 20,
                      }}
                    >
                      {(onClose) => (
                        <>
                          <ModalBody>
                            <div style={{ width: "auto", marginTop: 15, height: 5, fontSize: 14, fontFamily: "Kanit_B" }}>
                              {editedcode}
                            </div>
                            <div style={{ width: "auto", height: 30, fontSize: 16, fontFamily: "Kanit_B" }}>
                              {editedTaskname}
                            </div>
                            <div className="d-flex" style={{ textAlign: "center", height: 40 }}>
                              <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit", marginTop: 10, textAlign: "center", height: 35 }}>
                                ราคาจาก : {priceAct} บาท ลดราคาชิ้นละ
                              </div>
                              <input
                                autoFocus
                                className="form-control form-control-sm mt-1"
                                style={{ width: 50, marginLeft: 10, marginRight: 10, height: 25, fontSize: 18, fontFamily: "Kanit_B", justifyItems: "center" }}
                                value={priceDis}
                                onChange={(e) => setEditedpriceDis(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    cut_lot_Discount_manual();
                                    onClose();
                                  }
                                }}
                              />
                              <div style={{ width: "auto", fontSize: 17, marginTop: 10, fontFamily: "Kanit" }}>บาท</div>
                            </div>
                            <div style={{ width: "auto", fontSize: 17, fontFamily: "Kanit" }}>
                              คงเหลือ : {Number(priceAct) - Number(priceDis)} บาท
                            </div>
                          </ModalBody>
                          <ModalFooter className="d-flex border" style={{ height: 80, backgroundColor: "rgba(241, 241, 241, 1)" }}>
                            <button
                              className="btn btn-success"
                              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                              onClick={() => { cut_lot_Discount_manual(); onClose(); }}
                            >
                              OK
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ width: 80, height: 35, fontSize: 17, fontFamily: "Kanit" }}
                              onClick={onClose}
                            >
                              Close
                            </button>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
                </div>
              ) : (
                <div className={styles.mobileSalesList}>
                  {list.map((item, index) => (
                    <div
                      key={item.id}
                      className={`${styles.mobileSaleCard} ${index % 2 === 0 ? styles.mobileSaleCardEven : styles.mobileSaleCardOdd}`}
                      onClick={() => {
                        setcodeproductS(item.code_product);
                        setcostS(String(item.cost));
                      }}
                    >
                      {/* Card Header - Product Info */}
                      <div className={styles.mobileCardHeader}>
                        <div className={styles.mobileProductInfo}>
                          <div className={styles.mobileProductCode}>{item.code_product}</div>
                          <div className={styles.mobileProductName}>{item.name_product}</div>
                          {(item.nme_customer || item.name_customer) && (
                            <div className={styles.mobileCustomerName}>
                              {item.nme_customer || item.name_customer}
                            </div>
                          )}
                          {(() => {
                            const drugTypes = ["ขย.10", "ขย.11", "ขย.12", "ขย.13", "ข.ย.10", "ข.ย.11", "ข.ย.12", "ข.ย.13", "ขย.10 และ ขย.11", "ขย.10 และ ขย.12", "ขย.11 และ ขย.12"];
                            const prod = dataProduct.find((p: any) => p.code === item.code_product);
                            const matchType = prod && drugTypes.includes(prod.type) ? prod.type : null;
                            const matchSubtype = prod && drugTypes.includes(prod.subtype) ? prod.subtype : null;
                            const label = matchType || matchSubtype;
                            return label ? <div className={styles.mobileDrugLabel}>{label}</div> : null;
                          })()}
                        </div>
                        <div className={styles.mobileBadges}>
                          {(foundPairs.filter((d: any) => d.fixname2 === String(item.fixname))[0] ||
                            foundPairs.filter((d: any) => d.fixname1 === String(item.fixname))[0]) && (
                              <span className={styles.mobileInteractionBadge}>⚠️</span>
                            )}
                          {drugs.filter((w: any) => w.drugallergy === item.fixname).length > 0 && (
                            <span className={styles.mobileAllergyBadge}>🚫</span>
                          )}
                        </div>
                      </div>

                      {/* Card Body - Details */}
                      <div className={styles.mobileCardBody}>
                        <div className={styles.mobileDetailRow}>
                          <div className={styles.mobileDetailItem}>
                            <label>จำนวน</label>
                            <QtyInput item={item} changepay={changepay} onConfirm={cut_lot_Price_manual_inline} />
                          </div>
                          <div className={styles.mobileDetailItem}>
                            <label>หน่วย</label>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <button
                                disabled={changepay === "1"}
                                className={styles.mobileUnitButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchUnitConversions(item.code_product, item);
                                }}
                              >
                                {item.unit}
                              </button>
                              <span
                                className={`${styles.mobileBalance} ${getProductBalance(item.id_product) < 1
                                  ? styles.mobileBalanceLow
                                  : getProductBalance(item.id_product) <= 2
                                    ? styles.mobileBalanceMedium
                                    : styles.mobileBalanceNormal
                                  }`}
                                style={{ fontSize: '9px', padding: '0 4px' }}
                              >
                                {formatStockBalance(getProductBalance(item.id_product))} {item.unit}
                              </span>
                            </div>
                          </div>
                          <div className={styles.mobileDetailItem}>
                            <label>ราคา</label>
                            <span className={styles.mobilePrice}>{item.price}</span>
                          </div>
                          <div className={styles.mobileDetailItem}>
                            <label>รวม</label>
                            <span className={styles.mobileTotal}>{item.total}</span>
                          </div>
                        </div>

                        {changepay !== "1" && (
                          <div className={styles.mobileCardActions}>
                            <label className={styles.mobileLabelCheckbox}>
                              <input
                                type="checkbox"
                                checked={item.label}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  setIsChecked(e.target.checked);
                                  setList(list.map((task) =>
                                    task.id === item.id ? { ...task, label: e.target.checked } : task
                                  ));
                                }}
                              />
                              <span>ฉลาก</span>
                            </label>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                                localStorage.setItem("itemlist", String(list.length));
                              }}
                              type="button"
                              className={styles.mobileDeleteButton}
                            >
                              🗑️ ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="w-100">
        {changepay === "1" ? <Afterpay /> : <Beforepay />}
      </div>

      {/* Modal เปลี่ยนหน่วยสินค้า */}
      <Modal
        isOpen={modalUnitChange.isOpen}
        onOpenChange={modalUnitChange.onOpenChange}
        scrollBehavior={"inside"}
      >
        <ModalContent
          className="shadow-sm rounded rounded-2 border border"
          style={{
            backgroundColor: "rgba(255, 255, 255, 1)",
            width: "95vw",
            maxWidth: 600,
            maxHeight: "80vh",
            paddingBottom: 10
          }}
        >
          {(onClose) => (
            <>
              <ModalHeader
                style={{
                  backgroundColor: "rgba(241, 241, 241, 1)",
                  fontFamily: "Kanit_B",
                  fontSize: 18,
                }}
              >
                เปลี่ยนหน่วยสินค้า
              </ModalHeader>
              <ModalBody>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: "Kanit",
                    marginBottom: 10,
                  }}
                >
                  <strong>รหัส:</strong> {selectedUnitItem?.code_product} |{" "}
                  <strong>ชื่อ:</strong> {selectedUnitItem?.name_product}
                </div>
                <Table className="table table-bordered table-hover" size="sm">
                  <thead style={{ backgroundColor: "#f5f5f5" }}>
                    <tr>
                      <th
                        style={{
                          fontFamily: "Kanit_B",
                          textAlign: "center",
                          width: "15%",
                        }}
                      >
                        จำนวนสินค้า
                      </th>
                      <th
                        style={{
                          fontFamily: "Kanit_B",
                          textAlign: "center",
                          width: "20%",
                        }}
                      >
                        หน่วย
                      </th>
                      <th
                        style={{
                          fontFamily: "Kanit_B",
                          textAlign: "center",
                          width: "15%",
                        }}
                      >
                        จำนวนย่อย
                      </th>
                      <th
                        style={{
                          fontFamily: "Kanit_B",
                          textAlign: "center",
                          width: "20%",
                        }}
                      >
                        หน่วยย่อย
                      </th>
                      <th
                        style={{
                          fontFamily: "Kanit_B",
                          textAlign: "center",
                          width: "15%",
                        }}
                      >
                        ราคา
                      </th>
                      <th
                        style={{
                          fontFamily: "Kanit_B",
                          textAlign: "center",
                          width: "15%",
                        }}
                      >
                        เลือก
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-group-divider">
                    {unitOptions.map((unitOpt, index) => (
                      <tr
                        key={unitOpt.id || index}
                        style={{
                          backgroundColor: unitOpt.isBase ? "#F3F8FC" : "white",
                        }}
                      >
                        <td
                          style={{
                            fontFamily: "Kanit",
                            fontSize: 14,
                            textAlign: "center",
                          }}
                        >
                          {unitOpt.qty}
                        </td>
                        <td
                          style={{
                            fontFamily: "Kanit",
                            fontSize: 14,
                            textAlign: "center",
                          }}
                        >
                          {unitOpt.saleUnit}
                        </td>
                        <td
                          style={{
                            fontFamily: "Kanit",
                            fontSize: 14,
                            textAlign: "center",
                          }}
                        >
                          {unitOpt.subQty}
                        </td>
                        <td
                          style={{
                            fontFamily: "Kanit",
                            fontSize: 14,
                            textAlign: "center",
                          }}
                        >
                          {unitOpt.subUnit}
                        </td>
                        <td
                          style={{
                            fontFamily: "Kanit",
                            fontSize: 14,
                            textAlign: "center",
                          }}
                        >
                          {unitOpt.price.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-outline-success btn-sm"
                            style={{ fontFamily: "Kanit", fontSize: 12 }}
                            onClick={() => {
                              handleUnitSelect(unitOpt);
                              onClose();
                            }}
                          >
                            เลือก
                          </button>
                        </td>
                      </tr>
                    ))}
                    {unitOptions.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            fontFamily: "Kanit",
                            color: "#888",
                          }}
                        >
                          ไม่พบข้อมูลหน่วยสินค้า
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </ModalBody>
              <ModalFooter
                style={{ backgroundColor: "rgba(241, 241, 241, 1)" }}
              >
                <button
                  className="btn btn-secondary"
                  style={{
                    width: 80,
                    height: 35,
                    fontSize: 15,
                    fontFamily: "Kanit",
                  }}
                  onClick={onClose}
                >
                  ปิด
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
export default BodyTabSale;
