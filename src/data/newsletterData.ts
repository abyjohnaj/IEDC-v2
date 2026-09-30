import { NewsletterEdition } from '../types';

export const initialNewsletterEditions: NewsletterEdition[] = [
  {
    id: "edition-jan-2025",
    issueNo: "Vol 3, Issue 1",
    title: "Eureka Jan 2025",
    month: "January",
    year: "2025",
    date: "January 2025",
    theme: "Empowering Student Founders",
    icon: "📰",
    color: "#00f2fe",
    accent: "rgba(0, 242, 254, 0.15)",
    summary: "EKAH '25 Fest, CEO Mindsets, KSUM Prototype Grants, & Patent Support Guidelines.",
    highlights: [
      "01. Editor's Desk: The Power of Student Pre-Seed Grants",
      "02. EKAH '25: Techno-Cultural Innovation Showcase",
      "03. Startup Spotlight: EcoCharge Smart EV Charger",
      "04. Agri-Tech Breakthrough: Drone Crop Health Monitor",
      "05. KSUM Guidelines: Applying for ₹2 Lakhs Idea Grant",
      "06. IPR & Patent Cell: How BMCE protects student IP"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    flipHtmlUrl: "https://online.fliphtml5.com/vaxbbp/iipw/",
    pages: [
      {
        pageNumber: 1,
        title: "Cover & Vision",
        headline: "Empowering Next-Gen Student Founders",
        body: [
          "Welcome to the January 2025 edition of Eureka, the flagship publication of the Innovation & Entrepreneurship Development Centre (IEDC) at Baselios Mathews II College of Engineering.",
          "Over the past semester, our students have transformed classroom concepts into functional hardware prototypes, pre-seed backed ventures, and patented designs.",
          "From smart EV stations to AI-powered agricultural monitoring drones, BMCE engineers are actively reshaping the technological landscape of Kerala."
        ],
        callout: "Over 50+ startup ideas and prototypes were developed at IEDC BMCE this academic year!"
      },
      {
        pageNumber: 2,
        title: "Startup Spotlight #1: EcoCharge",
        headline: "EcoCharge - IoT EV Station",
        body: [
          "Developed by Ivin Saji (S7 CSE) and team, EcoCharge is a low-cost smart EV charging station designed specifically for educational institutions and campus facilities.",
          "Featuring an ESP32 micro-controller, dynamic QR automated UPI payments, and high-efficiency power relays, the unit enables seamless two-wheeler charging with automated billing.",
          "The project was awarded seed prototype grants and is presently deployed in test mode across the BMCE mechanical parking area."
        ],
        author: "By Student Lead Ivin Saji"
      },
      {
        pageNumber: 3,
        title: "Startup Spotlight #2: Agri-Drone",
        headline: "Agri-Drone Crop Scanner",
        body: [
          "Pioneered by Gouri Krishna (S7 ECE), this multispectral aerial imaging drone monitors rice paddy fields in Kollam and Alappuzha.",
          "By employing computer vision algorithms on NDVI infrared camera captures, pest infestations and nitrogen deficiencies are identified up to 14 days before visible leaf necrosis.",
          "The team has advanced to state-level finals under KSUM Idea Fest 2025."
        ],
        author: "By Student Lead Gouri Krishna"
      },
      {
        pageNumber: 4,
        title: "Grants & Incubation",
        headline: "How to Apply for KSUM Idea Grants (Up to ₹2 Lakhs)",
        body: [
          "1. Form an interdisciplinary student team of 2 to 4 members.",
          "2. Define a real-world market problem and draft a 5-slide pitch deck.",
          "3. Attend the weekly Design Thinking session at the IEDC Maker Space.",
          "4. Receive institutional approval and submit via the KSUM online portal with BMCE Nodal endorsement."
        ],
        callout: "Grants of ₹2 Lakhs are non-dilutive pre-seed funding for hardware and software prototyping!"
      }
    ]
  },
  {
    id: "edition-dec-2024",
    issueNo: "Vol 2, Issue 12",
    title: "Eureka Dec 2024",
    month: "December",
    year: "2024",
    date: "December 2024",
    theme: "2024 Innovation Milestone Review",
    icon: "🚀",
    color: "#ffab00",
    accent: "rgba(255, 171, 0, 0.15)",
    summary: "Year-End Incubator Success Stories, IoT Hardware Recaps, & Founder Interviews.",
    highlights: [
      "Reflecting on 25+ technical bootcamps",
      "500+ active student innovators engaged",
      "Over ₹10 Lakhs in total grant support generated",
      "Faculty leadership spotlight with Nodal Officers"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    flipHtmlUrl: "https://online.fliphtml5.com/vaxbbp/iipw/",
    pages: [
      {
        pageNumber: 1,
        title: "Year-End Review",
        headline: "A Year of Breakthroughs",
        body: [
          "2024 marked an unprecedented milestone for IEDC BMCE with the launch of our FabLab Maker Space and dedicated IoT prototyping benches.",
          "Our faculty nodal officers conducted over 15 patent drafting workshops, resulting in 4 preliminary patent submissions.",
          "We celebrate every student who took the courageous leap from consumer of technology to innovator and creator."
        ],
        callout: "BMCE was rated among the top active engineering college IEDC hubs in Kollam district!"
      }
    ]
  },
  {
    id: "edition-ksum-special",
    issueNo: "Special Edition",
    title: "KSUM Innovation Issue",
    month: "Special",
    year: "Special",
    date: "KSUM Special 2025",
    theme: "Grant Funding & Incubation Guide",
    icon: "💡",
    color: "#10b981",
    accent: "rgba(16, 185, 129, 0.15)",
    summary: "KSUM Idea Grants up to ₹2 Lakhs, Prototyping Labs, & Pre-Seed Funding Roadmap.",
    highlights: [
      "Step-by-step roadmap for funding applications",
      "Patent protection rules for student inventors",
      "Accessing Kerala Startup Mission mentor networks",
      "Legal fundamentals of incorporation"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    flipHtmlUrl: "https://online.fliphtml5.com/vaxbbp/iipw/",
    pages: [
      {
        pageNumber: 1,
        title: "Funding Blueprint",
        headline: "Navigating Pre-Seed Capital",
        body: [
          "Securing initial capital is the most critical hurdle for early-stage student founders.",
          "Through the institutional backing of BMCE and KSUM, students can access non-dilutive grants without giving up equity.",
          "Learn how to budget for bill-of-materials (BOM), sensor procurement, PCB fabrication, and cloud compute."
        ],
        callout: "Mentorship is available weekly in the IEDC Nodal Room."
      }
    ]
  }
];
