# 🦷 Dent X Learning & Innovation Center

ศูนย์การเรียนรู้นวัตกรรมทันตกรรมครบวงจร - เว็บไซต์สำหรับจัดแสดงนวัตกรรม ลงทะเบียนเข้าร่วมงาน และแบ่งปันความรู้ AI Prompts

## 📁 ไฟล์ในโปรเจค

```
dentx-innovation-center/
├── index.html                  # ไฟล์ HTML หลัก (เวอร์ชันต้นฉบับ)
├── index-original.html         # สำรองไฟล์ต้นฉบับ
├── enhanced-features.js        # JavaScript ฟีเจอร์เพิ่มเติม
├── ENHANCEMENT_GUIDE.md        # คู่มือการปรับปรุง
└── README.md                   # ไฟล์นี้
```

## ✨ ฟีเจอร์หลัก

### เวอร์ชันต้นฉบับ (index.html)
- ✅ Navigation แบบ Sticky พร้อม Mobile Menu
- ✅ Hero Section พร้อม Countdown Timer
- ✅ Innovation Showcase (3 โซน)
- ✅ Speaker Profiles (3 ท่าน)
- ✅ Prompt Library (2 ตัวอย่าง)
- ✅ Event Schedule (3 ช่วงเวลา)
- ✅ Booth Booking พร้อม Dynamic Pricing
- ✅ Location & Map
- ✅ FAQ Accordion
- ✅ Registration Form
- ✅ Login/Member System (Simulation)
- ✅ PDPA Banner
- ✅ Floating Buttons (LINE, Back to Top)

### ฟีเจอร์เพิ่มเติม (enhanced-features.js)
- 🆕 **Google Sheets Integration** - เชื่อมต่อฟอร์มกับ Google Sheets
- 🆕 **Enhanced Form Validation** - ตรวจสอบข้อมูลแบบ Real-time
- 🆕 **Toast Notifications** - แจ้งเตือนสวยงาม
- 🆕 **Scroll Animations** - Fade-in เมื่อ scroll
- 🆕 **Gallery Lightbox** - เปิดรูปภาพแบบ Lightbox
- 🆕 **Testimonial Carousel** - หมุนเวียนรีวิวอัตโนมัติ
- 🆕 **Lazy Loading** - โหลดรูปภาพแบบ Lazy
- 🆕 **Performance Monitoring** - ติดตามประสิทธิภาพ

### เนื้อหาเพิ่มเติม (ดูใน ENHANCEMENT_GUIDE.md)
- 📝 Prompt Library เพิ่มเติม 4 ตัวอย่าง (รวม 6 ตัว)
- 📅 Event Schedule ครบทั้งวัน (เพิ่ม 5 ช่วงเวลา)
- 🖼️ Gallery Section (3 รูป)
- 💬 Testimonials Section (3 รีวิว)

## 🚀 วิธีใช้งาน

### 1. เปิดเว็บไซต์แบบง่าย

```bash
cd dentx-innovation-center
python3 -m http.server 8000
```

เปิดเบราว์เซอร์ที่ `http://localhost:8000`

### 2. เพิ่มฟีเจอร์ขั้นสูง

ถ้าต้องการใช้ฟีเจอร์เพิ่มเติม:

1. เปิดไฟล์ `index.html`
2. เพิ่มก่อน `</body>`:
```html
<script src="enhanced-features.js"></script>
```

3. เพิ่มเนื้อหาตาม `ENHANCEMENT_GUIDE.md`

### 3. เชื่อมต่อ Google Sheets

ดูคู่มือใน `ENHANCEMENT_GUIDE.md` หัวข้อ "วิธีการติดตั้ง Google Sheets Integration"

## 🎨 การปรับแต่ง

### เปลี่ยนสี

ใช้ Tailwind CSS classes:
- Primary: `bg-blue-600`, `text-blue-600`
- Secondary: `bg-teal-600`, `text-teal-600`
- Accent: `bg-indigo-600`, `text-indigo-600`

### เปลี่ยนฟอนต์

แก้ไขใน `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### เปลี่ยน Countdown

แก้ไขใน `<script>`:
```javascript
const countDownDate = new Date("2026-03-15T09:00:00").getTime();
```

## 📱 Responsive Design

เว็บไซต์รองรับทุกขนาดหน้าจอ:
- 📱 Mobile (< 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🔧 การพัฒนาต่อ

### เพิ่ม Backend

ถ้าต้องการเพิ่ม Backend:

1. **Node.js + Express**
```javascript
// server.js
const express = require('express');
const app = express();
app.use(express.static('public'));
app.listen(3000);
```

2. **PHP**
```php
// submit.php
<?php
$data = $_POST;
// บันทึกลง database
?>
```

### เพิ่ม Database

- **MongoDB** - สำหรับข้อมูล JSON
- **MySQL** - สำหรับข้อมูลแบบ Relational
- **Firebase** - สำหรับ Real-time

### เพิ่ม Payment Gateway

- **Omise** - Payment Gateway ไทย
- **2C2P** - รองรับหลายธนาคาร
- **PromptPay QR** - สำหรับชำระผ่าน QR

## 📊 Analytics

เพิ่ม Google Analytics:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🐛 การแก้ปัญหา

### ฟอร์มส่งไม่ได้

1. ตรวจสอบ Console (F12)
2. ตรวจสอบ Google Sheets URL
3. ตรวจสอบ CORS settings

### Mobile Menu ไม่ทำงาน

1. ตรวจสอบ JavaScript load ครบหรือไม่
2. ตรวจสอบ `toggleMobileMenu()` function

### Countdown ไม่แสดง

1. ตรวจสอบ date format
2. ตรวจสอบ timezone

## 📞 ติดต่อ

- **Email**: dentx@nation.ac.th
- **LINE**: @dentx_center
- **Tel**: 02-XXX-XXXX

## 📄 License

MIT License - ใช้งานได้อย่างอิสระ

## 🙏 Credits

- **Tailwind CSS** - https://tailwindcss.com
- **Font Awesome** - https://fontawesome.com
- **SweetAlert2** - https://sweetalert2.github.io
- **Google Fonts** - https://fonts.google.com

---

Made with ❤️ for Dent X Innovation Center
