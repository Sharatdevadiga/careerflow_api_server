import mongoose from "mongoose";
import { parse } from "date-fns";

// Job roles and descriptions
const jobRolesandDescription = [
  {
    role: "Full stack web developer",
    description:
      "Develop and maintain scalable web applications using modern front-end and back-end technologies. Collaborate with designers and stakeholders to deliver user-friendly interfaces and robust server logic. Proficient in JavaScript, Node.js, React, and databases. Strong problem-solving skills and a passion for delivering seamless user experiences.",
  },
  {
    role: "Front End developer",
    description:
      "Design and build intuitive, responsive web interfaces using HTML, CSS, JavaScript, and frameworks like React or Angular. Collaborate with designers to implement visually appealing, user-focused designs. Optimize performance and ensure cross-browser compatibility. Knowledge of UI/UX principles and accessibility standards is essential.",
  },
  {
    role: "Backend developer",
    description:
      "Develop and maintain server-side logic, APIs, and database integration for web applications. Proficient in Node.js, Python, or Java, with expertise in RESTful APIs and database management. Focus on scalability, security, and performance. Work closely with front-end developers to deliver seamless, functional applications.",
  },
  {
    role: "Mobile app developer",
    description:
      "Build and optimize mobile applications for iOS and Android platforms using technologies like Flutter, React Native, or native frameworks. Collaborate with designers to implement engaging user experiences. Ensure app performance, responsiveness, and usability. Strong knowledge of mobile architecture and app store submission processes required.",
  },
  {
    role: "Data analyst",
    description:
      "Analyze and interpret complex datasets to generate actionable insights. Proficient in SQL, Excel, and visualization tools like Tableau or Power BI. Develop dashboards, reports, and presentations to support data-driven decision-making. Strong analytical and problem-solving skills with attention to detail.",
  },
  {
    role: "Data scientist",
    description:
      "Use advanced analytics, machine learning, and statistical modeling to solve complex business problems. Proficient in Python, R, and data analysis libraries. Communicate insights effectively to stakeholders and develop predictive models. Passionate about uncovering trends and deriving actionable insights from data.",
  },
  {
    role: "Data engineer",
    description:
      "Design, develop, and maintain scalable data pipelines and storage solutions. Expertise in ETL processes, cloud platforms, and tools like Hadoop or Spark. Ensure data quality, availability, and security. Collaborate with data scientists and analysts to provide robust datasets for analysis.",
  },
  {
    role: "Software developer",
    description:
      "Design, develop, and maintain software applications across various platforms. Proficient in programming languages like Python, Java, or C#. Focus on writing clean, efficient code and collaborating with teams to deliver functional, user-friendly applications. Strong debugging and problem-solving skills are essential.",
  },
  {
    role: "Software tester",
    description:
      "Plan, execute, and document test cases to ensure software quality and reliability. Proficient in manual and automated testing techniques. Identify and report bugs, ensuring adherence to testing standards. Collaborate with developers to resolve issues and ensure a seamless user experience.",
  },
  {
    role: "Devops engineer",
    description:
      "Build and maintain CI/CD pipelines to streamline software delivery. Expertise in cloud platforms, automation tools, and containerization technologies like Docker and Kubernetes. Collaborate with developers to enhance system reliability, scalability, and performance. Strong knowledge of scripting and infrastructure as code is crucial.",
  },
];

// Companies data
export const companiesData = [
  { company: "TechWave Inc.", employerId: "674756a9eecd34aa44fda716" },
  { company: "CodeCraft Labs", employerId: "674756abeecd34aa44fda719" },
  { company: "Innovative Solutions", employerId: "674756abeecd34aa44fda71b" },
  { company: "DevSphere", employerId: "674756abeecd34aa44fda71d" },
  { company: "DataDynamos", employerId: "674756abeecd34aa44fda721" },
  { company: "Appify", employerId: "674756abeecd34aa44fda723" },
  { company: "NextGen Coders", employerId: "674756abeecd34aa44fda725" },
  { company: "AlgoWorks", employerId: "674756aceecd34aa44fda727" },
  { company: "TestEase", employerId: "674756aceecd34aa44fda729" },
  { company: "CloudSync", employerId: "674756aceecd34aa44fda72b" },
];

// Locations and dates
const locations = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Gurugram",
  "Noida",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Indore",
  "Kochi",
  "Chandigarh",
  "Coimbatore",
  "Lucknow",
  "Nagpur",
  "Bhubaneswar",
  "Vizag (Visakhapatnam)",
  "Trivandrum (Thiruvananthapuram)",
];

// Dates
const dates = [
  "09/10/2024",
  "28/11/2024",
  "18/07/2024",
  "06/06/2024",
  "26/06/2024",
  "15/10/2024",
  "25/10/2024",
  "30/11/2024",
  "04/09/2024",
  "01/08/2024",
  "09/04/2024",
  "28/05/2024",
  "18/04/2024",
  "06/05/2024",
  "26/03/2024",
  "15/03/2024",
  "25/04/2024",
  "30/05/2024",
  "04/04/2024",
  "01/03/2024",
];

// Generate random locations
const getRandomLocations = () => {
  const shuffled = [...locations].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 3) + 2);
};

// Generate jobs data
const generateJobs = () => {
  const jobs = [];
  jobRolesandDescription.forEach((job, i) => {
    for (let j = 0; j < 10; j++) {
      const company =
        companiesData[Math.floor(Math.random() * companiesData.length)];

      const newJob = {
        role: job.role,
        company: company.company,
        date: parse(
          dates[Math.floor(Math.random() * dates.length)],
          "dd/MM/yyyy",
          new Date()
        ),
        locations: getRandomLocations(),
        description: job.description,
        remote: Math.random() < 0.5, // Randomly assign true/false
        employerId: new mongoose.Types.ObjectId(company.employerId),
      };
      jobs.push(newJob);
    }
  });
  return jobs;
};

export const jobsData = generateJobs();

// For testing create, update and delete a job
const extraJobs = [
  {
    // _id: "67476e89b77d77e8196b6580",
    role: "Full stack web developer",
    company: "DataDynamos",
    date: "2024-05-05T18:30:00.000Z",
    locations: ["Bhubaneswar", "Gurugram", "Mumbai", "Noida"],
    description:
      "Develop and maintain scalable web applications using modern front-end and back-end technologies. Collaborate with designers and stakeholders to deliver user-friendly interfaces and robust server logic. Proficient in JavaScript, Node.js, React, and databases. Strong problem-solving skills and a passion for delivering seamless user experiences.",
    remote: false,
    employerId: "674756abeecd34aa44fda721",
  },
];
