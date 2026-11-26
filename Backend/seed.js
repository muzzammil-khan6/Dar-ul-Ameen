require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Auth = require("./src/models/auth.model");
const Subject = require("./src/models/subject.model");
const Rate = require("./src/models/rate.model");
const Settings = require("./src/models/settings.model");
const Schedule = require("./src/models/schedule.model");
const connectDB = require("./src/services/db.service");

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB for seeding...");

  // 1. Settings
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      commissionPercentage: 20,
      platformName: "Dar-ul-Ameen Tutor Booking Platform",
      minWithdrawal: 500,
    });
    console.log("Seeded platform settings.");
  }

  // 2. Subjects
  const subjectsData = [
    {
      name: "Mathematics",
      grades: ["Class 9", "Class 10", "Class 11", "Class 12", "O Level", "A Level"],
    },
    {
      name: "Physics",
      grades: ["Class 9", "Class 10", "Class 11", "Class 12", "O Level", "A Level"],
    },
    {
      name: "Chemistry",
      grades: ["Class 9", "Class 10", "Class 11", "Class 12", "O Level", "A Level"],
    },
    {
      name: "English",
      grades: ["Class 6-8", "Class 9", "Class 10", "O Level", "IELTS"],
    },
    {
      name: "Computer Science",
      grades: ["Class 9", "Class 10", "Class 11", "Class 12", "Web Dev"],
    },
    {
      name: "Urdu",
      grades: ["Class 1-5", "Class 6-8", "Class 9", "Class 10"],
    },
    {
      name: "Islamic Studies",
      grades: ["Quran Reading", "Tajweed", "Class 9-10", "Hifz"],
    },
  ];

  const createdSubjects = [];
  for (const s of subjectsData) {
    let sub = await Subject.findOne({ name: s.name });
    if (!sub) {
      sub = await Subject.create(s);
      console.log(`Created subject: ${s.name}`);
    }
    createdSubjects.push(sub);
  }

  // 3. Admin Rates (for 7 days / week / 1 hour class)
  const ratesData = [
    { subjectName: "Mathematics", weeklyFullRate: 7000 },
    { subjectName: "Physics", weeklyFullRate: 7000 },
    { subjectName: "Chemistry", weeklyFullRate: 6500 },
    { subjectName: "English", weeklyFullRate: 6000 },
    { subjectName: "Computer Science", weeklyFullRate: 7500 },
    { subjectName: "Urdu", weeklyFullRate: 5000 },
    { subjectName: "Islamic Studies", weeklyFullRate: 5000 },
  ];

  for (const r of ratesData) {
    const subDoc = createdSubjects.find((s) => s.name === r.subjectName);
    let rate = await Rate.findOne({ subjectName: r.subjectName });
    if (!rate) {
      await Rate.create({
        subject: subDoc ? subDoc._id : null,
        subjectName: r.subjectName,
        weeklyFullRate: r.weeklyFullRate,
      });
      console.log(`Created rate for ${r.subjectName}: ${r.weeklyFullRate}`);
    }
  }

  // 4. Default Admin User
  const adminEmail = "admin@darulameen.com";
  let admin = await Auth.findOne({ email: adminEmail });
  if (!admin) {
    const hash = await bcrypt.hash("AdminPassword123", 10);
    admin = await Auth.create({
      fullName: "Super Admin",
      email: adminEmail,
      password: hash,
      phone: "+923001234567",
      city: "Islamabad",
      country: "Pakistan",
      preferredLanguage: "English",
      role: ["admin"],
      teachingStatus: "approved",
      isGoogleVerified: true,
    });
    console.log("Created Admin: admin@darulameen.com / AdminPassword123");
  }

  // 5. Approved Teacher User
  const teacherEmail = "teacher@darulameen.com";
  let teacher = await Auth.findOne({ email: teacherEmail });
  if (!teacher) {
    const hash = await bcrypt.hash("TeacherPassword123", 10);
    teacher = await Auth.create({
      fullName: "Prof. Tariq Mahmood",
      email: teacherEmail,
      password: hash,
      phone: "+923009876543",
      city: "Karachi",
      country: "Pakistan",
      preferredLanguage: "English",
      role: ["teacher", "student"],
      teachingStatus: "approved",
      bio: "Experienced Mathematics & Physics tutor with 10+ years of teaching high school & college students.",
      picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
      isGoogleVerified: true,
    });
    console.log("Created Teacher: teacher@darulameen.com / TeacherPassword123");
  }

  // Schedule for teacher
  let schedule = await Schedule.findOne({ teacher: teacher._id });
  if (!schedule) {
    const mathSub = createdSubjects.find((s) => s.name === "Mathematics");
    const physicsSub = createdSubjects.find((s) => s.name === "Physics");

    // Formula: Rate = (7000 / 7) * 3 * (30 / 60) = 1500
    schedule = await Schedule.create({
      teacher: teacher._id,
      subjects: [
        {
          subjectId: mathSub ? mathSub._id : null,
          name: "Mathematics",
          grades: ["Class 9", "Class 10", "O Level"],
        },
        {
          subjectId: physicsSub ? physicsSub._id : null,
          name: "Physics",
          grades: ["Class 9", "Class 10"],
        },
      ],
      daysPerWeek: 3,
      selectedDays: ["Monday", "Wednesday", "Friday"],
      duration: 30,
      rates: [
        { subjectName: "Mathematics", calculatedRate: 1500 },
        { subjectName: "Physics", calculatedRate: 1500 },
      ],
      timeSlots: [
        { day: "Monday", startTime: "16:00", endTime: "18:00" },
        { day: "Monday", startTime: "19:00", endTime: "21:00" },
        { day: "Wednesday", startTime: "16:00", endTime: "18:00" },
        { day: "Friday", startTime: "16:00", endTime: "18:00" },
      ],
      isApproved: true,
    });
    console.log("Created Schedule for Prof. Tariq Mahmood");
  }

  // 6. Pending Teacher User
  const pendingEmail = "pendingteacher@darulameen.com";
  let pendingTeacher = await Auth.findOne({ email: pendingEmail });
  if (!pendingTeacher) {
    const hash = await bcrypt.hash("TeacherPassword123", 10);
    pendingTeacher = await Auth.create({
      fullName: "Ms. Ayesha Khan",
      email: pendingEmail,
      password: hash,
      phone: "+923005556677",
      city: "Lahore",
      country: "Pakistan",
      preferredLanguage: "Urdu",
      role: ["teacher"],
      teachingStatus: "pending",
      bio: "English and Urdu language expert with passion for modern interactive pedagogy.",
      picture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250",
      isGoogleVerified: true,
    });
    console.log("Created Pending Teacher: pendingteacher@darulameen.com / TeacherPassword123");
  }

  // 7. Student User
  const studentEmail = "student@darulameen.com";
  let student = await Auth.findOne({ email: studentEmail });
  if (!student) {
    const hash = await bcrypt.hash("StudentPassword123", 10);
    student = await Auth.create({
      fullName: "Ahmed Raza",
      email: studentEmail,
      password: hash,
      phone: "+923214567890",
      city: "Karachi",
      country: "Pakistan",
      preferredLanguage: "English",
      role: ["student"],
      teachingStatus: "approved",
      studentWallet: 2000,
      isGoogleVerified: true,
    });
    console.log("Created Student: student@darulameen.com / StudentPassword123");
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
