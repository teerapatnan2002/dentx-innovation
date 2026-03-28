# วิธีการใช้งาน Firebase ฟรี (Spark Plan)

Firebase มีแพ็กเกจฟรีที่ชื่อว่า **"Spark Plan"** ซึ่งเพียงพอสำหรับการเริ่มต้นและใช้งานทั่วไปสำหรับเว็บไซต์นี้ครับ

## สิ่งที่คุณจะได้รับฟรี (ตลอดชีพ หรือจนกว่าจะเกินลิมิต):
1.  **Authentication**: รองรับผู้ใช้ได้ไม่จำกัด (สำหรับ Email/Password และ Social Login)
2.  **Cloud Firestore (ฐานข้อมูล)**:
    *   พื้นที่เก็บข้อมูล: 1 GB
    *   การอ่านเอกสาร: 50,000 ครั้ง/วัน
    *   การเขียนเอกสาร: 20,000 ครั้ง/วัน
    *   การลบเอกสาร: 20,000 ครั้ง/วัน
3.  **Hosting**: พื้นที่ 10 GB (ถ้าคุณต้องการอัพโหลดเว็บขึ้นออนไลน์)

---

## ขั้นตอนการสร้าง Project และนำค่ามาใส่ในเว็บ

### 1. สร้างโปรเจกต์
1.  ไปที่ [Firebase Console](https://console.firebase.google.com/)
2.  ล็อคอินด้วย Google Account (Gmail) ของคุณ
3.  คลิก **"Create a project"** (หรือ "Add project")
4.  ตั้งชื่อโปรเจกต์ (เช่น `dentx-project`) แล้วกด Continue
5.  (Optional) เรื่อง Google Analytics จะเปิดหรือปิดก็ได้ จากนั้นกด **Create Project**

### 2. สร้าง App (Web)
1.  เมื่อโปรเจกต์สร้างเสร็จ ให้มองหาไอคอน **`</>` (Web)** ตรงกลางหน้าจอ แล้วคลิก
2.  ตั้งชื่อ App (เช่น `DentX Website`)
3.  **ไม่ต้องติ๊ก** Firebase Hosting ก็ได้ (ถ้ายังไม่เอาขึ้นจริง)
4.  กด **Register app**

### 3. คัดลอก Config
1.  คุณจะเห็นหน้าจอที่มีโค้ดเยอะๆ ให้มองหาตัวแปรที่ชื่อ `const firebaseConfig = { ... };`
2.  **สำคัญ!** ก๊อปปี้เฉพาะข้อมูลในปีกกา `{ ... }` มาครับ ตัวอย่างเช่น:
    ```javascript
    {
      apiKey: "AIzaSyD...",
      authDomain: "dentx-project.firebaseapp.com",
      projectId: "dentx-project",
      storageBucket: "dentx-project.firebasestorage.app",
      messagingSenderId: "123456...",
      appId: "1:123456..."
    }
    ```

### 4. เปิดใช้งาน Database (Firestore)
**ขั้นตอนนี้สำคัญมาก ถ้าไม่ทำ ข้อมูลจะไม่ถูกบันทึก**
1.  ในเมนูด้านซ้าย เลือก **Build** > **Firestore Database**
2.  คลิก **Create database**
3.  เลือก Location (แนะนำ `asia-southeast1` สิงคโปร์ เพื่อความเร็วในไทย)
4.  **Security Rules**: เลือก **Start in test mode** (เพื่อให้ทดสอบได้เลยโดยไม่ต้องแก้ permission ในช่วงแรก)
    *   *หมายเหตุ: ใน Test mode ข้อมูลจะเปิดให้ใครก็ได้เขียนได้ชั่วคราว (30 วัน) เหมาะสำหรับการทดสอบครับ*
5.  กด **Create**

### 5. เปิดใช้งาน Authentication (Login)
1.  ในเมนูด้านซ้าย เลือก **Build** > **Authentication**
2.  กด **Get started**
3.  ในแถบ **Sign-in method**, เลือก **Anonymous** (และเปิด Enable) -> กด Save
    *   *เนื่องจากโค้ดชุดปัจจุบันตั้งค่าไว้ให้ Login แบบ Anonymous/Admin ครับ*

---

## เสร็จแล้ว!
กลับมาที่ไฟล์ `firebase-config.js` ในเครื่องของคุณ แล้วนำข้อมูลจาก **ขั้นตอนที่ 3** มาวางแทนที่ Code เดิมได้เลยครับ
