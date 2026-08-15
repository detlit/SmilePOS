



"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import {
    ShoppingBag,
    Package,
    BarChart3,
    Users,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    Zap,
    Clock,
    CheckCircle,
    Star,
    TrendingUp,
    Smartphone,
    Languages,
    Mic,
    ScanFace,
    Layout,
    Printer,
    Monitor,
    Layers,
    PieChart,
    ChevronRight,
    Search,
    Shield,
    BarChart,
    CreditCard,
    Phone,
    Mail,
    MapPin,
    MessageCircle
} from "lucide-react";
import styles from "./index.module.css";
import Link from "next/link";
import RegistorForm from "../componant/RegistorForm";

export default function LandingPage() {
    const fadeIn: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }
        })
    };

    const categories = [
        {
            icon: <Zap size={32} />,
            title: "Smart POS & Sales",
            features: [
                "หน้าขายอัจฉริยะแบบ 2 จอ (ผู้ขายและลูกค้า)",
                "ฉลากสินค้า 5 ภาษา (ไทย, พม่า, จีน, อังกฤษ, ลาว)",
                "ปรับเปลี่ยนรูปแบบ ฉลากสินค้าได้หลายแบบ",
                "รองรับระบบ Barcode แบบ 100%"
            ],
            color: "#2A6AAA"
        },
        {
            icon: <PieChart size={32} />,
            title: "Management & Finance",
            features: [
                "Dashboard สรุปภาพรวมธุรกิจ Real-time",
                "วิเคราะห์กำไร ขาดทุน และงบการเงินทันที",
                "แยกสิทธิ์การมองเห็น (เจ้าของ vs พนักงาน)",
                "ระบบตัดสต็อก (Stock) อัตโนมัติและแม่นยำ"
            ],
            color: "blue"
        },
        {
            icon: <Mic size={32} />,
            title: "Intelligence & AI",
            features: [
                "บันทึกประวัติการรักษาด้วยเสียง (Voice-to-History)",
                "AI วิเคราะห์การสั่งซื้อสินค้าให้คุ้มค่าที่สุด",
                "ระบบวิเคราะห์แนวโน้มการขายรายปี",
                "สั่งพิมพ์รายงานได้ทุกที่ ทุกเวลา"
            ],
            color: "red"
        },
        {
            icon: <Smartphone size={32} />,
            title: "Mobility & Security",
            features: [
                "ใช้งานได้ลื่นไหลทั้ง Windows และ Mobile",
                "เช็คชื่อพนักงานด้วย Location และ Face Scan",
                "นับสต็อกและดูยอดขายผ่านมือถือได้ทันที",
                "รองรับการใช้งานหลาย User พร้อมกัน"
            ],
            color: "indigo"
        }
    ];

    return (
        <div className={styles.container}>
            {/* Ambient Background */}
            <div className={styles.ambientGlow}>
                <div className={styles.floatingOrb} />
                <div className={styles.floatingOrb} />
                <div className={styles.floatingOrb} />
            </div>

            {/* Navbar */}
            <nav className={styles.navbar}>
                <Link href="/" className={styles.logo}>
                    <img src="/images/brand/smilestore-mascot.svg" alt="SmileStore POS Logo" className={styles.logoImg} />
                    <span>SmileStore POS</span>
                </Link>
                <div className={styles.navLinks}>
                    <Link href="#home" className={styles.navLink}>หน้าแรก</Link>
                    <Link href="#platform" className={styles.navLink}>Platform</Link>
                    <Link href="#features" className={styles.navLink}>ฟีเจอร์เด่น</Link>
                    <Link href="#showcase" className={styles.navLink}>ตัวอย่างระบบ</Link>
                    <Link href="#pricing" className={styles.navLink}>ราคา</Link>
                    <Link href="#contact" className={styles.navLink}>ติดต่อเรา</Link>
                </div>
                <div className={styles.navActionGroup}>
                    <Link href="/" className={styles.btnLogin}>เข้าสู่ระบบ</Link>
                    <Link href="#register" className={styles.btnSignup}>สมัครสมาชิก</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" className={styles.hero}>
                <div className={styles.heroContent}>
                    <motion.div className={styles.eyebrow} initial="hidden" animate="visible" variants={fadeIn} custom={0}>
                        <Star size={14} /> ระบบจัดการร้านค้าที่ดีที่สุดในปี 2025
                    </motion.div>
                    <motion.h1 className={styles.title} initial="hidden" animate="visible" variants={fadeIn} custom={1}>
                        จัดการร้านค้าให้เป็นเรื่องง่าย<br /><span>รวดเร็ว และแม่นยำ</span>
                    </motion.h1>
                    <motion.p className={styles.subtitle} initial="hidden" animate="visible" variants={fadeIn} custom={2}>
                        SmileStore POS ช่วยให้คุณโฟกัสกับการดูแลลูกค้าได้มากขึ้น ด้วยระบบที่ออกแบบมาเพื่อความสบายตาและใช้งานง่ายที่สุด
                    </motion.p>
                    <motion.div className={styles.ctaGroup} initial="hidden" animate="visible" variants={fadeIn} custom={3}>
                        <Link href="#register" className={styles.btnPrimary}>
                            ทดลองใช้งาน ฟรี 30 วัน <ChevronRight size={20} />
                        </Link>
                    </motion.div>
                </div>
                <motion.div className={styles.heroImageContainer} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.4 }}>
                    <img src="/images/brand/smilestore-lockup.svg" alt="SmileStore POS" className={styles.mascotImg} />
                </motion.div>
            </section>

            {/* Platform Showcase Section */}
            <section id="platform" className={styles.platformSection}>
                <div className={styles.sectionHeader} style={{ marginBottom: '60px' }}>

                    <motion.h2
                        className={styles.sectionTitle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Platform online เก็บข้อมูลใน Cloud Server
                    </motion.h2>
                </div>
                <div className={styles.platformGrid}>
                    <motion.div className={styles.platformCard} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className={styles.platformImageWrapper}>
                            <img src="/images/landing/platform_web.png" alt="Web Application" className={styles.platformImage} />
                        </div>
                        <div className={styles.platformInfo}>
                            <h3 className={styles.platformTitle}><Monitor size={24} /> Web Application</h3>
                            <p className={styles.platformDesc}>จัดการร้านค้าได้ทุกที่ผ่านเบราว์เซอร์ เข้าถึงข้อมูลได้รวดเร็วแบบ Cloud-based</p>
                        </div>
                    </motion.div>

                    <motion.div className={styles.platformCard} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                        <div className={styles.platformImageWrapper}>
                            <img src="/images/landing/platform_windows.png" alt="Windows Application" className={styles.platformImage} />
                        </div>
                        <div className={styles.platformInfo}>
                            <h3 className={styles.platformTitle}><Layout size={24} /> Windows Application</h3>
                            <p className={styles.platformDesc}>ประสิทธิภาพสูงสุดสำหรับการใช้งานหน้าร้าน (POS) ตอบสนองไว เสถียร และปลอดภัย</p>
                        </div>
                    </motion.div>

                    <motion.div className={styles.platformCard} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                        <div className={styles.platformImageWrapper}>
                            <img src="/images/landing/platform_mobile.png" alt="Web Mobile" className={styles.platformImage} />
                        </div>
                        <div className={styles.platformInfo}>
                            <h3 className={styles.platformTitle}><Smartphone size={24} /> Web Mobile</h3>
                            <p className={styles.platformDesc}>คุมสต็อก เช็คยอดขาย และบริหารงานผ่านมือถือได้ทันที สะดวกสบายทุกสถานการณ์</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Feature Comparison Table Section */}
            <section id="pricing" className={styles.comparisonSection}>
                <div className={styles.sectionHeader}>
                    <motion.h2 className={styles.sectionTitle} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        ราคา
                    </motion.h2>
                    <motion.div
                        className={styles.pricingCardsContainer}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Monthly Plan */}
                        <div className={styles.pricingCard}>
                            <h3 className={styles.planName}>รายเดือน</h3>
                            <div className={styles.planPrice}>
                                <span className={styles.priceAmount}>750</span>
                                <span className={styles.pricePeriod}>บาท / เดือน</span>
                            </div>
                            <p className={styles.pricingSubtext}>จ่ายรายเดือน ยืดหยุ่นได้เสมอ</p>
                        </div>

                        {/* Yearly Plan */}
                        <div className={`${styles.pricingCard} ${styles.pricingCardRecommended}`}>
                            <div className={styles.cardBadge}>คุ้มที่สุด</div>
                            <h3 className={styles.planName}>รายปี</h3>
                            <div className={styles.planPrice}>
                                <span className={styles.priceAmount}>8,000</span>
                                <span className={styles.pricePeriod}>บาท / ปี</span>
                            </div>
                            <div className={styles.saveBadge}>ประหยัดไป 1,000 บาท</div>
                            <p className={styles.pricingSubtext}>เฉลี่ยเพียง 667 บาท/เดือน</p>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.freeTrialBadgeContainer}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.freeTrialBadge}>
                            <Sparkles size={20} />
                            ทดลองใช้งานฟรี 30 วัน
                        </div>
                    </motion.div>

                    <motion.h5
                        className={styles.tableRow}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{
                            marginTop: 40,
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            color: '#64748b',
                            fontWeight: 600
                        }}
                    >
                        <Zap size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#f59e0b' }} />
                        ราคาเดียว ครบทุก Platform
                    </motion.h5>
                </div>


            </section>

            {/* Feature Categories Section */}
            <section id="features" className={styles.sectionWrapper}>
                <div className={styles.sectionHeader}>
                    <motion.h2 className={styles.sectionTitle} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={0}>
                        ครบทุกฟีเจอร์... จบในที่เดียว
                    </motion.h2>
                    <motion.p className={styles.sectionSubtitle} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={1}>
                        เราผสานเทคโนโลยี AI และงานดีไซน์ที่เน้นความ "สบายตา" เพื่อให้พนักงานและเจ้าของร้านทำงานได้อย่างมีความสุข
                    </motion.p>
                </div>
                {/**                        
                <div className={styles.featureGrid}>
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={idx}
                            className={styles.featureCard}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            custom={idx}
                        >
                            <div className={styles.cardIcon}>{cat.icon}</div>
                            <h3 className={styles.cardTitle}>{cat.title}</h3>
                            <ul className={styles.cardList}>
                                {cat.features.map((f, i) => (
                                    <li key={i} className={styles.cardListItem}>
                                        <CheckCircle size={18} /> {f}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>*/}

                <motion.div className={styles.tableWrapper} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                    <div className={styles.tableContainer}>
                        <table className={styles.comparisonTable}>
                            <thead>
                                <tr>
                                    <th>ฟีเจอร์การทำงาน</th>
                                    <th>Web App</th>
                                    <th>Windows App</th>
                                    <th>Web Mobile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    {
                                        category: "SALES & POS",
                                        items: [
                                            { f: "หน้าขายอัจฉริยะแบบ 2 จอ (ผู้ขายและลูกค้า)", v: [1, 1, 0], color: "#2A6AAA" },
                                            { f: "รองรับระบบ Barcode และ QR-Code แบบ 100%", v: [1, 1, 1], color: "#2A6AAA" },
                                            { f: "รับเงินโอนผ่าน QR-Payment ได้", v: [1, 1, 0] },
                                            { f: "พิมพ์ใบเสร็จแบบ Auto", v: [0, 1, 0] },
                                            { f: "สามารถตั้งค่าโปรโมชั่นต่างๆ ได้ตามต้องการ", v: [1, 1, 0] }
                                        ]
                                    },
                                    {
                                        category: "AI INTELLIGENCE & ANALYSIS",
                                        items: [
                                            { f: "AI วิเคราะห์การสั่งซื้อสินค้าที่ประหยัดสุด ในงบที่กำหนด แบบ Realtime", v: [1, 1, 0], color: "#4338ca" },
                                            { f: "AI ช่วยแปลภาษา ระหว่างผู้ขายและลูกค้า ผ่านเสียงพูด 4 ภาษา (ไทย พม่า จีน อังกฤษ ลาว) แบบ Rea", v: [1, 1, 0], color: "#4338ca" },
                                            { f: "วิเคราะห์กำไร ขาดทุน และงบการเงิน แบบ Realtime", v: [1, 1, 0], color: "#4338ca" }
                                        ]
                                    },
                                    {
                                        category: "OPERATION & SERVICES",
                                        items: [
                                            { f: "ระบบตัดสต็อก (Stock) อัตโนมัติและแม่นยำ แบบ Realtime", v: [1, 1, 0] },
                                            { f: "พิมพ์ฉลากสินค้า 5 ภาษา (ไทย พม่า จีน อังกฤษ ลาว)", v: [1, 1, 0], color: "#0d9488" },
                                            { f: "ปรับเปลี่ยนรูปแบบฉลากสินค้าได้หลายแบบ", v: [1, 1, 0], color: "#0d9488" },
                                            { f: "สร้างและจัดการใบเสนอราคา ใบวางบิล ใบแจ้งหนี้", v: [1, 1, 0] },
                                            { f: "สร้างและจัดการใบรับสินค้า / ใบสั่งซื้อสินค้า", v: [1, 1, 0] },
                                            { f: "แยกสิทธิ์การเข้าถึง (เจ้าของ vs พนักงาน) เพื่อความปลอดภัยของข้อมูล", v: [1, 1, 0] },
                                            { f: "มีระบบ ตัวช่วยในการเปิดร้าน ได้เร็วขึ้น", v: [1, 1, 0], color: "#0d9488" },
                                            { f: "บันทึกประวัติการรักษาด้วยเสียง (Voice-to-History)", v: [1, 1, 0], color: "#0d9488" },
                                            { f: "มี Function สำหรับติดตามอาการลูกค้าได้", v: [1, 1, 0] },
                                            { f: "มีระบบสะสมแต้มสมาชิก สำหรับส่วนลดต่างๆ", v: [1, 1, 0], color: "#0d9488" },
                                            { f: "มีระบบค่าหยิบ (Insentive) รายสินค้า", v: [1, 1, 0] },
                                            { f: "รองรับการใช้งานหลาย User พร้อมกัน", v: [1, 1, 1] }
                                        ]
                                    },
                                    {
                                        category: "REPORT",
                                        items: [
                                            { f: "รายงานการขาย รายวัน / รายเดือน", v: [1, 1, 0] },
                                            { f: "รายงาน Stock คลังสินค้า", v: [1, 1, 0] },
                                            { f: "รายงาน ข.ย. 9 10 11", v: [1, 1, 0] }
                                        ]
                                    },
                                    {
                                        category: "MOBILE EXCLUSIVE",
                                        items: [
                                            { f: "ตั้งค่าและดูผลค่าหยิบ หรือเป้ายอดขาย เฉพาะมือถือ", v: [0, 0, 1], color: "#7c3aed" },
                                            { f: "นับสต็อกผ่านมือถือและสรุปผล แบบ Real-time โดยไม่ต้องปิดร้าน", v: [0, 0, 1], color: "#7c3aed" },
                                            { f: "ขายสินค้าผ่านมือถือได้", v: [0, 0, 1] },
                                            { f: "Check in-out ด้วย Location ผ่าน Face Scan (แสกนใบหน้า)", v: [0, 0, 1], color: "#7c3aed" }
                                        ]
                                    }
                                ].map((group, groupIdx) => (
                                    <React.Fragment key={groupIdx}>
                                        <tr className={styles.categoryRow}>
                                            <td colSpan={4}>{group.category}</td>
                                        </tr>
                                        {group.items.map((row, idx) => (
                                            <tr key={idx} className={styles.tableRow}>
                                                <td className={styles.featureName} style={row.color ? { color: row.color, fontWeight: 700 } : {}}>
                                                    {row.f}
                                                </td>
                                                {row.v.map((val, i) => (
                                                    <td key={i}>
                                                        {val ? (
                                                            <div className={styles.checkIcon}><CheckCircle size={18} /></div>
                                                        ) : (
                                                            <span className={styles.dashIcon}>—</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </section>

            {/* Visual Showcase Section */}
            <section id="showcase" className={styles.sectionWrapper}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>สัมผัสประสบการณ์ระดับพรีเมียม</h2>
                    <p className={styles.sectionSubtitle}>ดีไซน์ที่เรียบง่ายแต่ทรงพลัง ช่วยให้คุณเข้าถึงข้อมูลที่สำคัญได้ในพริบตา</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                    {/* Item 1: Dashboard */}
                    <div className={styles.showcaseGrid}>
                        <motion.div className={styles.showcaseImageWrapper} initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <img src="/images/landing/dashboard.png" alt="Business Dashboard" className={styles.showcaseImage} />
                            <div className={styles.showcaseBadge}>Real-time Analytics</div>
                        </motion.div>
                        <div className={styles.showcaseContent}>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px' }}>Dashboard อัจฉริยะ</h3>
                            <p style={{ color: '#64748b', fontSize: '1.2rem', lineHeight: 1.7 }}>
                                เห็นทุกตัวเลขสำคัญในหน้าเดียว ไม่ว่าจะเป็นยอดขายรายวัน กำไรสะสม หรือสินค้าที่ต้องเติมสต็อก ช่วยคุณตัดสินใจทางธุรกิจได้อย่างแม่นยำ
                            </p>
                        </div>
                    </div>

                    {/* Item 2: POS */}
                    <div className={`${styles.showcaseGrid} ${styles.showcaseReverse}`}>
                        <div className={styles.showcaseContent}>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px' }}>ระบบขายหน้าร้าน (POS)</h3>
                            <p style={{ color: '#64748b', fontSize: '1.2rem', lineHeight: 1.7 }}>
                                รองรับการทำงานแบบ 2 หน้าจอ จบการขายได้รวดเร็ว ลดคิวลูกค้า และระบบจัดการฉลากสินค้าอัตโนมัติที่แม่นยำที่สุด
                            </p>
                        </div>
                        <motion.div className={styles.showcaseImageWrapper} initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <img src="/images/landing/pos.png" alt="POS System" className={styles.showcaseImage} />
                            <div className={`${styles.showcaseBadge} ${styles.badgeBlue}`}>High Performance POS</div>
                        </motion.div>
                    </div>

                   
                </div>
            </section>



            {/* Registration Section */}
            <section id="register" className={styles.sectionWrapper} style={{ backgroundColor: '#f8fafc', borderRadius: '40px', padding: '80px 20px' }}>
                <div className={styles.sectionHeader} style={{ marginBottom: '40px' }}>
                    <h2 className={styles.sectionTitle}>เริ่มใช้งานได้ทันที</h2>
                    <p className={styles.sectionSubtitle}>เปิดบัญชีร้านค้าของคุณได้ง่ายๆ ในไม่กี่วินาที</p>
                </div>
                <RegistorForm />
            </section>

            {/* Contact Section */}
            <section id="contact" className={styles.contactSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>ติดต่อเรา</h2>
                    <p className={styles.sectionSubtitle}>มีคำถามหรือต้องการคำปรึกษา? ทีมงานของเราพร้อมดูแลคุณเสมอ</p>
                </div>
                <div className={styles.contactGrid}>
                    <div className={styles.contactCard}>
                        <div className={styles.contactIcon}><Phone size={22} /></div>
                        <h4>โทรศัพท์</h4>
                        <p>090-2588143</p>
                        <p>081-0181691</p>
                    </div>
                    <div className={styles.contactCard}>
                        <div className={styles.contactIcon}><MessageCircle size={22} /></div>
                        <h4>Line ID</h4>
                        {/* <a href="#" className={styles.contactLink}>duis</a> */}
                        <img src="/images/landing/lineid.jpg" alt="Line ID QR Code" className={styles.qrCode} />
                    </div>
                    <div className={styles.contactCard}>
                        <div className={styles.contactIcon}><Mail size={22} /></div>
                        <h4>อีเมล</h4>
                        <p>dui09510665@gmail.com</p>
                    </div>
                    <div className={styles.contactCard}>
                        <div className={styles.contactIcon}><MapPin size={22} /></div>
                        <h4>ที่อยู่</h4>
                        <p><strong>บริษัท ดีทูพี อ๊อปชั่น จำกัด</strong></p>
                        <p>เลขที่ 123/400 หมู่บ้านชัยพฤกษ์ ต.บางปลา อ.บางพลี จ.สมุทรปราการ 10540</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center', gap: '40px' }}>
                    <Link href="#" className={styles.navLink}>นโยบายความเป็นส่วนตัว</Link>
                    <Link href="#" className={styles.navLink}>ข้อกำหนดการใช้งาน</Link>
                    <Link href="#" className={styles.navLink}>ติดต่อสอบถาม</Link>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>© 2025 SmileStore POS. Designed for a better healthy world.</div>
            </footer>
        </div>
    );
}
