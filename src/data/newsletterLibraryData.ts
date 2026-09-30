import { NewsletterEdition } from '../types';

export const newsletterLibraryData: NewsletterEdition[] = [
  // --- TIER 1 (TOP TIER: Issues #24 - #19, 2026) ---
  {
    id: "edition-24",
    issue: 24,
    issueNo: "Issue #24",
    title: "Tech Weekly",
    subtitle: "Autonomous Systems & Quantum Leap",
    date: "September 2026",
    month: "September",
    year: "2026",
    category: "Technology",
    tier: 1,
    angleIndex: 0,
    readTime: "6 min read",
    author: "Er. Ivin Saji (Chief Editor)",
    theme: "Autonomous Robotics & Quantum Leap",
    icon: "⚡",
    color: "#0284c7",
    accent: "rgba(2, 132, 199, 0.2)",
    spineColor: "#1e3a8a",
    coverStyle: "navy",
    summary: "Exploring breakthrough autonomous drone corridors, solid-state battery packaging, and campus pre-seed spinouts.",
    excerpt: "The latest developments in autonomous edge compute, student-led drone deliveries, and venture capital syndicates in South India.",
    content: "Full edition detailing autonomous vehicle test corridors, patent approvals for micro-turbines, and ₹15 Lakhs student seed funding allocations.",
    highlights: [
      "Autonomous aerial delivery test corridor across Sasthamcotta campus",
      "Quantum annealing algorithms for microgrid load balancing",
      "Seed round announcement: ₹15 Lakhs for BMCE student spinout"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Autonomous Corridors",
        headline: "Aerial Robotics Take Flight at BMCE",
        body: [
          "Over the past three months, the Robotics Innovation Hub at BMCE has tested an autonomous payload drone capable of delivering 4.5kg emergency medical kits within a 12km radius.",
          "Operating on custom flight controllers running PX4 firmware with real-time obstacle avoidance, the team completed over 80 incident-free test flights.",
          "Commercialization discussions are underway with local healthcare centers and emergency response coordinators across Kollam district."
        ],
        callout: "The project achieved a 99.4% precision landing rate on automated docking pads.",
        author: "By Robotics Lead Gouri Krishna"
      },
      {
        pageNumber: 2,
        title: "Pre-Seed Allocation",
        headline: "Venture Grants Reach New Record",
        body: [
          "IEDC BMCE has formally distributed its Q3 2026 pre-seed grant tranches to 6 student-founded ventures, totaling ₹15 Lakhs in non-dilutive capital.",
          "Awardees span battery thermal management systems, automated spice sorting hardware, and decentralized carbon accounting software.",
          "Mentorship sessions with Kerala Startup Mission (KSUM) EIRs will commence next week to prepare prototypes for Series Seed pitching."
        ],
        callout: "Applications for the Autumn Incubator Cohort open on October 1st.",
        author: "By Nodal Officer Dr. Reji Mohan"
      }
    ]
  },
  {
    id: "edition-23",
    issue: 23,
    issueNo: "Issue #23",
    title: "Clean Energy",
    subtitle: "Solid-State Storage & Grid Edge",
    date: "August 2026",
    month: "August",
    year: "2026",
    category: "CleanTech",
    tier: 1,
    angleIndex: 1,
    readTime: "5 min read",
    author: "Prof. Priya Nair (CleanTech Fellow)",
    theme: "Green Hydrogen & Energy Transitions",
    icon: "🌱",
    color: "#059669",
    accent: "rgba(5, 150, 105, 0.2)",
    spineColor: "#064e3b",
    coverStyle: "emerald",
    summary: "Solid-state electrolyte advancements, campus rooftop solar microgrid deployment, and green hydrogen prototyping.",
    excerpt: "Campus engineers install an intelligent battery energy storage system coupled to a 50kW solar canopy.",
    content: "Complete engineering blueprint for microgrid synchronizers and thermal runaway prevention in lithium iron phosphate packs.",
    highlights: [
      "50kW campus solar canopy commissioning",
      "Next-generation sodium-ion cell testing laboratory",
      "Green hydrogen electrolyzer benchmark results"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Solar Canopy Launch",
        headline: "50kW Solar Microgrid Commissioned",
        body: [
          "BMCE engineering departments have synchronized a 50kW intelligent solar canopy directly with the primary academic substation.",
          "Equipped with bidirectional inverters and real-time power factor correction, the array offset 38% of campus daytime electricity consumption during initial trials.",
          "Telemetry data is streamed live to the IoT dashboard for student power systems research."
        ],
        callout: "Estimated annual carbon abatement exceeds 42 metric tons of CO2.",
        author: "By EEE Department Team"
      }
    ]
  },
  {
    id: "edition-22",
    issue: 22,
    issueNo: "Issue #22",
    title: "Founder's Log",
    subtitle: "From College Dorm to Market Traction",
    date: "July 2026",
    month: "July",
    year: "2026",
    category: "Startups",
    tier: 1,
    angleIndex: 2,
    readTime: "7 min read",
    author: "Alumnus Arun Varma",
    theme: "Venture Building & Customer Discovery",
    icon: "💼",
    color: "#d97706",
    accent: "rgba(217, 119, 6, 0.2)",
    spineColor: "#78350f",
    coverStyle: "amber",
    summary: "Interviews with three alumni founders who scaled student projects to profitable B2B SaaS and hardware enterprises.",
    excerpt: "Essential lessons in product-market fit, enterprise sales cycles, and managing equity tables before graduation.",
    content: "Case studies in B2B enterprise validation, building Minimum Viable Hardware, and securing angel investor commitments.",
    highlights: [
      "How AgroBot secured ₹80 Lakhs in angel funding",
      "Navigating GST, DPIIT recognition, and IP filing as student founders",
      "The top 5 pitch deck mistakes identified by angel investors"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Founder Interview",
        headline: "Building Hardware When Everyone Builds Apps",
        body: [
          "Arun Varma (Class of '24) founded AgroBot inside the BMCE FabLab during his third year of mechanical engineering.",
          "'The hardest lesson was understanding that farmers don't buy IoT sensors—they buy predictable crop yields,' Arun explains.",
          "By redesigning the hardware for toolless field maintenance, AgroBot deployed 300+ units across southern Kerala within 18 months."
        ],
        callout: "AgroBot was awarded the KSUM Best Campus Startup of the Year award.",
        author: "Interview by Editorial Board"
      }
    ]
  },
  {
    id: "edition-21",
    issue: 21,
    issueNo: "Issue #21",
    title: "NextGen AI",
    subtitle: "Small Language Models & Edge Neural Nets",
    date: "June 2026",
    month: "June",
    year: "2026",
    category: "AI & ML",
    tier: 1,
    angleIndex: 3,
    readTime: "6 min read",
    author: "Gopika S. (AI Research Lead)",
    theme: "Local LLMs on Low-Power Microcontrollers",
    icon: "🧠",
    color: "#7c3aed",
    accent: "rgba(124, 58, 237, 0.2)",
    spineColor: "#581c87",
    coverStyle: "plum",
    summary: "Running quantized 1-bit and 2-bit neural networks on edge ARM microcontrollers for offline computer vision.",
    excerpt: "Breakthroughs in TinyML, enabling embedded devices to perform voice keyword spotting and gesture detection without cloud servers.",
    content: "Benchmarking Gemma and Llama-based quantized models on ESP32-S3 and Raspberry Pi 5 hardware setups.",
    highlights: [
      "Offline Malayalam voice recognition on edge microcontrollers",
      "Quantization strategies for sub-50mW inference",
      "Ethics & safety guidelines for campus synthetic intelligence"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "TinyML Innovations",
        headline: "AI Without the Cloud: Embedded Intelligence",
        body: [
          "The CSE AI laboratory has demonstrated an offline speech model capable of recognizing 50+ Malayalam technical commands on an ESP32 chip drawing under 180mA.",
          "By pruning redundant attention heads and quantizing weights to 4-bit integer tensors, memory consumption was reduced by 82%.",
          "This enables smart agricultural irrigation controllers to operate reliably in rural areas with zero cellular connectivity."
        ],
        callout: "Inference latency averaged 42 milliseconds on a 240MHz dual-core Xtensa processor.",
        author: "By CSE Research Team"
      }
    ]
  },
  {
    id: "edition-20",
    issue: 20,
    issueNo: "Issue #20",
    title: "IoT Horizons",
    subtitle: "Industrial Telemetry & Smart Campus",
    date: "May 2026",
    month: "May",
    year: "2026",
    category: "Hardware",
    tier: 1,
    angleIndex: 4,
    readTime: "5 min read",
    author: "Prof. George Thomas",
    theme: "Long-Range Telemetry & Mesh Sensors",
    icon: "📡",
    color: "#b91c1c",
    accent: "rgba(185, 28, 28, 0.2)",
    spineColor: "#7f1d1d",
    coverStyle: "crimson",
    summary: "Deploying LoRaWAN gateways across Kollam for reservoir flood warning and municipal water quality monitoring.",
    excerpt: "Campus LoRaWAN network covers 18km of terrain, streaming lake water telemetry to disaster mitigation authorities.",
    content: "Detailed schematics of solar-harvesting sensor buoys deployed in Sasthamcotta Fresh Water Lake.",
    highlights: [
      "Sasthamcotta Lake water purity sensor network",
      "LoRaWAN gateway deployment with 22km line-of-sight range",
      "Low-power wake-on-radio circuit design"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Lake Guardian Project",
        headline: "Preserving Kerala's Largest Freshwater Lake",
        body: [
          "Students from civil and electronics departments placed five solar-powered telemetry buoys across Sasthamcotta Lake.",
          "Measuring dissolved oxygen, pH, turbidity, and temperature every 15 minutes, data is beamed to the district water authority.",
          "Early automated warnings can detect agricultural runoff surges before water treatment intakes are compromised."
        ],
        callout: "The project received the Kerala State Pollution Control Board Commendation.",
        author: "By Environmental Sensing Cell"
      }
    ]
  },
  {
    id: "edition-19",
    issue: 19,
    issueNo: "Issue #19",
    title: "Biotech Vistas",
    subtitle: "Biomaterials & Plant Extraction Tech",
    date: "April 2026",
    month: "April",
    year: "2026",
    category: "BioTech",
    tier: 1,
    angleIndex: 5,
    readTime: "5 min read",
    author: "Dr. Ananya Roy",
    theme: "Sustainable Polymers from Agricultural Waste",
    icon: "🔬",
    color: "#0f172a",
    accent: "rgba(15, 23, 42, 0.2)",
    spineColor: "#18181b",
    coverStyle: "obsidian",
    summary: "Synthesizing biodegradable packaging polymers from coconut husk lignin and cassava starch derivatives.",
    excerpt: "A sustainable alternative to single-use plastics developed using indigenous agricultural by-products.",
    content: "Tensile strength testing, soil decomposition curves, and industrial scalability benchmarks for bio-polymeric films.",
    highlights: [
      "Coconut husk biopolymer decomposes in 45 days in natural soil",
      "Tensile strength matches commercial LDPE packaging films",
      "Pre-patent application filed under Indian Patent Office"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Eco-Polymers",
        headline: "From Coconut Husks to Biodegradable Packaging",
        body: [
          "Kerala generates hundreds of tons of coir pith and coconut coir waste annually. An interdisciplinary team has developed a method to extract microcrystalline cellulose.",
          "When cross-linked with biodegradable plasticizers, the resulting polymer sheet shows remarkable water resistance and flexibility.",
          "The material decomposes completely into organic compost within six weeks under standard soil conditions."
        ],
        callout: "Provisional patent filed: Application No. 202641019842.",
        author: "By Biomaterials Laboratory"
      }
    ]
  },

  // --- TIER 2 (UPPER MIDDLE: Issues #18 - #13, 2025-2026) ---
  {
    id: "edition-18",
    issue: 18,
    issueNo: "Issue #18",
    title: "Idea Fest 26",
    subtitle: "KSUM State Finalists from BMCE",
    date: "March 2026",
    month: "March",
    year: "2026",
    category: "Incubation",
    tier: 2,
    angleIndex: 0,
    readTime: "5 min read",
    author: "IEDC Executive Committee",
    theme: "State-Level Innovation Competitions",
    icon: "🏆",
    color: "#d97706",
    accent: "rgba(217, 119, 6, 0.2)",
    spineColor: "#78350f",
    coverStyle: "amber",
    summary: "Celebrating 4 student teams selected for the Kerala Startup Mission Idea Fest 2026 State Grand Finale.",
    excerpt: "Over 8,000 collegiate teams competed across Kerala. BMCE secured four finalist spots across hardware and healthcare.",
    content: "Profiles of the finalist projects: MedAssist IV Monitor, AquaPave Porous Concrete, AgriDrone, and RoboWelder.",
    highlights: [
      "MedAssist: Smart intravenous flow regulator with wireless alarm",
      "AquaPave: Self-draining porous paving stones preventing urban flooding",
      "Total finalist funding awards: ₹8 Lakhs"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "State Finalists",
        headline: "Four BMCE Innovations Advance to Kerala Finals",
        body: [
          "The annual KSUM Idea Fest represents the highest collegiate innovation honors in Kerala. Four BMCE teams cleared multi-stage jury evaluations.",
          "Judges praised the practical, ruggedized design of the hardware prototypes, built specifically for local climatic challenges.",
          "Each team receives ₹2 Lakhs in prototyping grants and incubator desk space at the Kochi Integrated Startup Complex."
        ],
        callout: "BMCE ranked among the top 5 engineering colleges statewide for final selections.",
        author: "By IEDC Nodal Secretariat"
      }
    ]
  },
  {
    id: "edition-17",
    issue: 17,
    issueNo: "Issue #17",
    title: "Design Thinking",
    subtitle: "Human-Centered Engineering Principles",
    date: "February 2026",
    month: "February",
    year: "2026",
    category: "Methodology",
    tier: 2,
    angleIndex: 1,
    readTime: "6 min read",
    author: "Devika M. (UI/UX Fellow)",
    theme: "Empathy-Driven Product Prototyping",
    icon: "🎨",
    color: "#0284c7",
    accent: "rgba(2, 132, 199, 0.2)",
    spineColor: "#1e3a8a",
    coverStyle: "navy",
    summary: "A practical guide to empathy mapping, rapid cardboard prototyping, and usability testing before writing code.",
    excerpt: "Why the best engineers spend 80% of their early cycle observing users in the field rather than debugging in a lab.",
    content: "Step-by-step framework: Empathize, Define, Ideate, Prototype, and Test with case studies from local healthcare centers.",
    highlights: [
      "How empathy interviews changed a hospital triage kiosk design",
      "Rapid paper prototyping workflows for hardware enclosures",
      "Reducing feature bloat in student engineering projects"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Empathy in Engineering",
        headline: "Before the Code: Listening to Real Users",
        body: [
          "Too many student engineering teams start by selecting a microcontroller or cloud database before speaking with a single user.",
          "During a 2-day Design Sprint, teams conducted on-site interviews with municipal sanitation workers and primary health nurses.",
          "This led to 14 fundamental design simplifications that cut prototype assembly costs by over 40%."
        ],
        callout: "The highest performing product is the one that solves the simplest acute pain point.",
        author: "By Design Thinking Club"
      }
    ]
  },
  {
    id: "edition-16",
    issue: 16,
    issueNo: "Issue #16",
    title: "2026 Roadmap",
    subtitle: "Incubation Milestones & Research Targets",
    date: "January 2026",
    month: "January",
    year: "2026",
    category: "Strategy",
    tier: 2,
    angleIndex: 2,
    readTime: "5 min read",
    author: "Principal & Nodal Council",
    theme: "Institutional Strategy for Student Startups",
    icon: "🗺️",
    color: "#059669",
    accent: "rgba(5, 150, 105, 0.2)",
    spineColor: "#064e3b",
    coverStyle: "emerald",
    summary: "Strategic targets for 2026: 20 new patent filings, ₹50 Lakhs in external funding, and a dedicated rapid PCB prototyping line.",
    excerpt: "Unveiling the new 3-year vision document to make BMCE a premier incubation hub in southern Kerala.",
    content: "Institutional policies including academic credits for validated startup incubation and faculty mentorship incentives.",
    highlights: [
      "New 4-layer PCB milling machine installed in FabLab",
      "Startup student attendance concession guidelines formalized",
      "Corporate mentorship partnership with Technopark enterprises"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Strategic Vision",
        headline: "Empowering 500+ Innovators by 2027",
        body: [
          "The governing body of BMCE has ratified new entrepreneurship guidelines allowing student founders to earn up to 4 academic credits for incubation work.",
          "A modern 4-layer PCB milling and pick-and-place prototyping line is now operational in the IEDC Maker Space.",
          "Students can now design, manufacture, and assemble SMD surface-mount circuits on campus within 24 hours."
        ],
        callout: "Turnaround time for custom PCB hardware dropped from 12 days to under 24 hours.",
        author: "By Academic Council"
      }
    ]
  },
  {
    id: "edition-15",
    issue: 15,
    issueNo: "Issue #15",
    title: "Year in Review",
    subtitle: "50 Startups & 25 Technical Bootcamps",
    date: "December 2025",
    month: "December",
    year: "2025",
    category: "Review",
    tier: 2,
    angleIndex: 3,
    readTime: "6 min read",
    author: "Editorial Council",
    theme: "Annual Milestone Documentation",
    icon: "🎉",
    color: "#b91c1c",
    accent: "rgba(185, 28, 28, 0.2)",
    spineColor: "#7f1d1d",
    coverStyle: "crimson",
    summary: "Reflecting on 2025: 50 active startup ventures incubated, 25 state workshops, and over 1,200 participant registrations.",
    excerpt: "A year of unprecedented growth across hackathons, bootcamps, and patent disclosures.",
    content: "Comprehensive photographic archive and metrics review across all seven engineering departments.",
    highlights: [
      "Over ₹18 Lakhs in cumulative seed funding awarded",
      "320 hardware prototypes fabricated in the Maker Space",
      "12 faculty research patents published in official gazette"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "2025 Retrospective",
        headline: "Transforming Classroom Theory into Tangible Impact",
        body: [
          "2025 proved that student engineers are ready to build real products when provided with uninhibited access to tools and mentorship.",
          "From agricultural sensors in Kuttanad to smart medical dispensers in Thiruvananthapuram hospitals, BMCE solutions touched real lives.",
          "We celebrate every student who dared to take an idea past paper calculations into the physical world."
        ],
        callout: "BMCE IEDC received an 'A' grade accreditation from Kerala Startup Mission.",
        author: "By Chief Editor"
      }
    ]
  },
  {
    id: "edition-14",
    issue: 14,
    issueNo: "Issue #14",
    title: "Patent Playbook",
    subtitle: "Intellectual Property for Student Inventors",
    date: "November 2025",
    month: "November",
    year: "2025",
    category: "Legal & IP",
    tier: 2,
    angleIndex: 4,
    readTime: "5 min read",
    author: "Adv. Sneha Pillai (IP Counsel)",
    theme: "Patents, Trademarks & Prior Art Search",
    icon: "⚖️",
    color: "#0f172a",
    accent: "rgba(15, 23, 42, 0.2)",
    spineColor: "#18181b",
    coverStyle: "obsidian",
    summary: "Everything an engineering student needs to know about prior art searches, provisional patent filing, and non-disclosure agreements.",
    excerpt: "How to protect your engineering designs before publishing conference papers or presenting at hackathons.",
    content: "Detailed walkthrough of the Indian Patent Office e-filing portal, Form 1, Form 2, and drafting valid independent claims.",
    highlights: [
      "The critical difference between provisional and complete specifications",
      "Why publishing a paper before patent filing destroys novelty",
      "How BMCE reimburses 100% of student patent statutory fees"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "IP Protection",
        headline: "Do Not Give Away Your Invention: A Guide to Patents",
        body: [
          "Every year, dozens of brilliant student innovations lose patent eligibility because the team uploaded their code to GitHub or gave a public conference talk.",
          "Under Indian patent law, public disclosure prior to filing eliminates the worldwide novelty requirement.",
          "Filing a provisional patent specification costs students as little as ₹1,600 and reserves priority for 12 full months while prototyping continues."
        ],
        callout: "The BMCE IPR Cell offers free confidential claim drafting for all students.",
        author: "By IPR Facilitation Cell"
      }
    ]
  },
  {
    id: "edition-13",
    issue: 13,
    issueNo: "Issue #13",
    title: "Maker Culture",
    subtitle: "FabLab Equipment & Additive Manufacturing",
    date: "October 2025",
    month: "October",
    year: "2025",
    category: "Prototyping",
    tier: 2,
    angleIndex: 5,
    readTime: "5 min read",
    author: "FabLab Manager Akhil Raj",
    theme: "3D Printing, Laser Cutting & CNC Milling",
    icon: "🛠️",
    color: "#7c3aed",
    accent: "rgba(124, 58, 237, 0.2)",
    spineColor: "#581c87",
    coverStyle: "plum",
    summary: "Mastering FDM 3D printing tolerances, resin printing for high-detail enclosures, and laser-cut acrylic chassis construction.",
    excerpt: "A hands-on manual for students building physical enclosures for IoT and robotic devices.",
    content: "Filament selection guide (PLA vs PETG vs ABS vs Carbon Fiber Nylon) with heat deflection benchmarks.",
    highlights: [
      "Designing snap-fit joints for 3D printed electronics housings",
      "Optimizing print orientation to eliminate support material waste",
      "CNC milling custom aluminum brackets and heat sinks"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Rapid Prototyping",
        headline: "From CAD Model to Working Enclosure in 4 Hours",
        body: [
          "The biggest hurdle between an engineering breadboard circuit and a customer-ready prototype is the physical enclosure.",
          "With three high-speed CoreXY 3D printers and a 100W CO2 laser cutter, the BMCE FabLab enables students to iterate enclosures daily.",
          "Learn the golden rules of draft angles, heat-set brass threaded inserts, and cooling ventilation channels."
        ],
        callout: "Over 800 hours of 3D printing time were logged by students this semester.",
        author: "By FabLab Technical Team"
      }
    ]
  },

  // --- TIER 3 (LOWER MIDDLE: Issues #12 - #7, 2025) ---
  {
    id: "edition-12",
    issue: 12,
    issueNo: "Issue #12",
    title: "Agri-Tech Wave",
    subtitle: "Precision Agriculture for Kerala Crops",
    date: "September 2025",
    month: "September",
    year: "2025",
    category: "AgriTech",
    tier: 3,
    angleIndex: 0,
    readTime: "5 min read",
    author: "Agritech Working Group",
    theme: "Smart Irrigation & Soil Chemistry",
    icon: "🌾",
    color: "#059669",
    accent: "rgba(5, 150, 105, 0.2)",
    spineColor: "#064e3b",
    coverStyle: "emerald",
    summary: "Automated nitrogen-phosphorus-potassium (NPK) optical spectroscopy sensors and solar drip irrigation systems.",
    excerpt: "Developing affordable agricultural diagnostic tools tailored to paddy, rubber, and spice plantations.",
    content: "Field test results from 12 pepper plantations in Idukki and rice paddies in Upper Kuttanad.",
    highlights: [
      "Low-cost optical NPK soil scanner reduces fertilizer waste by 30%",
      "Automated solar valve controllers for hillside rubber plantations",
      "Direct farmer feedback and field trial testimonials"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Precision Farming",
        headline: "Smart Sensors for Kerala's Spice and Paddy Crops",
        body: [
          "Over-fertilization leads to nutrient runoff and acidic soil degradation across Kerala's sensitive agricultural belts.",
          "Students developed a portable reflectance spectrometer that estimates soil nitrogen and potassium levels in 90 seconds.",
          "Calibrated against laboratory spectrophotometer results, the device demonstrated 91.2% accuracy at 1/20th the cost."
        ],
        callout: "Field tested with 24 farmer co-operatives in Pathanamthitta district.",
        author: "By Agritech Student Cohort"
      }
    ]
  },
  {
    id: "edition-11",
    issue: 11,
    issueNo: "Issue #11",
    title: "EV Architecture",
    subtitle: "Battery Management & Motor Drivers",
    date: "August 2025",
    month: "August",
    year: "2025",
    category: "Electric Vehicles",
    tier: 3,
    angleIndex: 1,
    readTime: "6 min read",
    author: "Automotive Research Cell",
    theme: "Electric Mobility & Fast Charging",
    icon: "⚡",
    color: "#0284c7",
    accent: "rgba(2, 132, 199, 0.2)",
    spineColor: "#1e3a8a",
    coverStyle: "navy",
    summary: "Design and validation of a smart CAN-bus Battery Management System (BMS) with cell-level active thermal balancing.",
    excerpt: "BMCE motorsports team designs custom 48V 60Ah lithium pack with integrated telemetry and regenerative braking controller.",
    content: "Technical schematics of active cell balancing circuits and CAN-bus protocol decoders.",
    highlights: [
      "Custom BMS with cell balancing accuracy within 8 millivolts",
      "CAN-bus telemetry streaming to digital instrument cluster",
      "Regenerative braking algorithm recovering up to 14% kinetic energy"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "EV Prototyping",
        headline: "Designing Safe Lithium Battery Packs from Scratch",
        body: [
          "Thermal runaway prevention is the primary engineering challenge in electric two-wheelers operating in tropical Kerala climates.",
          "The mechanical and electrical team created a modular pack using cylindrical 21700 cells encased in aluminum heatsink sleeves.",
          "Thermal imaging during 2C continuous discharge verified maximum cell temperatures remained under 41°C."
        ],
        callout: "The custom BMS cleared all electrical safety stress tests under ARAI guidelines.",
        author: "By Automotive Club"
      }
    ]
  },
  {
    id: "edition-10",
    issue: 10,
    issueNo: "Issue #10",
    title: "Seed Capital",
    subtitle: "Navigating Angel Networks & Grants",
    date: "July 2025",
    month: "July",
    year: "2025",
    category: "Finance",
    tier: 3,
    angleIndex: 2,
    readTime: "6 min read",
    author: "Kiran R. (Finance Mentor)",
    theme: "Valuations, Cap Tables & Term Sheets",
    icon: "💰",
    color: "#d97706",
    accent: "rgba(217, 119, 6, 0.2)",
    spineColor: "#78350f",
    coverStyle: "amber",
    summary: "Understanding SAFE notes, convertible debt, founder vesting schedules, and how to pitch to angel syndicates in South India.",
    excerpt: "Demystifying startup funding terminology so technical founders never sign away control of their company.",
    content: "Case studies of early seed valuations, dilution calculations, and founder equity allocation formulas.",
    highlights: [
      "Understanding pre-money vs post-money valuation calculations",
      "Why 4-year vesting with a 1-year cliff protects all co-founders",
      "Government seed funds: KSUM Seed Fund, Startup India Seed Scheme"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Venture Finance",
        headline: "The Student Founder's Guide to Term Sheets",
        body: [
          "Many promising student companies fail not because their technology didn't work, but because of co-founder disputes and predatory early investor terms.",
          "Before accepting any investment, understand liquidation preferences, board seat allocations, and anti-dilution clauses.",
          "Always prioritize government non-dilutive grant funds before offering equity to private angel investors."
        ],
        callout: "Over 80% of successful student hardware companies in Kerala began with government grants.",
        author: "By Finance & Incubation Cell"
      }
    ]
  },
  {
    id: "edition-9",
    issue: 9,
    issueNo: "Issue #9",
    title: "SpaceTech",
    subtitle: "CubeSats & High-Altitude Ballooning",
    date: "June 2025",
    month: "June",
    year: "2025",
    category: "Aerospace",
    tier: 3,
    angleIndex: 3,
    readTime: "5 min read",
    author: "Aerospace Working Group",
    theme: "Stratospheric Payloads & Micro-Satellites",
    icon: "🚀",
    color: "#0f172a",
    accent: "rgba(15, 23, 42, 0.2)",
    spineColor: "#18181b",
    coverStyle: "obsidian",
    summary: "Launching a 1U CubeSat payload to 28,000 meters altitude using a weather balloon to measure atmospheric ozone and cosmic radiation.",
    excerpt: "Student telemetry recovered safely with 4K stratospheric curvature footage and radiation sensor logs.",
    content: "Thermal vacuum chamber test results, GPS recovery beacon schematics, and parachute deployment telemetry.",
    highlights: [
      "Stratospheric altitude reached: 28,420 meters above sea level",
      "Geiger counter detected 18x cosmic ray radiation increase at apex",
      "Parachute deployment and GPS recovery in Pathanamthitta forest within 2 hours"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Near-Space Launch",
        headline: "BMCE Payload Reaches 28km Stratosphere",
        body: [
          "On a clear Sunday morning, the Aerospace Club released a latex weather balloon carrying a 950g CubeSat instrumentation pod.",
          "Ascending through the troposphere at 5.2 m/s, sensors logged temperature extremes of -52°C and atmospheric pressure below 14 hectopascals.",
          "The dual-frequency APRS radio beacon enabled the chase team to locate the payload within 20 minutes of touchdown."
        ],
        callout: "Video footage capturing the curvature of the Earth was presented at ISRO VSSC symposium.",
        author: "By Aerospace Student Club"
      }
    ]
  },
  {
    id: "edition-8",
    issue: 8,
    issueNo: "Issue #8",
    title: "MedTech Focus",
    subtitle: "Affordable Diagnostic Devices",
    date: "May 2025",
    month: "May",
    year: "2025",
    category: "HealthTech",
    tier: 3,
    angleIndex: 4,
    readTime: "6 min read",
    author: "Biomedical Innovation Team",
    theme: "Point-of-Care Healthcare Devices",
    icon: "🩺",
    color: "#b91c1c",
    accent: "rgba(185, 28, 28, 0.2)",
    spineColor: "#7f1d1d",
    coverStyle: "crimson",
    summary: "Developing non-invasive anemia screeners, smart pulse oximeters, and automated phototherapy blankets for rural clinics.",
    excerpt: "How engineering precision brings hospital-grade diagnostics to primary health centers in remote rural areas.",
    content: "Clinical comparison data between optical hemoglobin measurement and gold-standard venous blood draws.",
    highlights: [
      "Non-invasive optical hemoglobin estimation in 10 seconds",
      "Zero consumables cost per test",
      "Clinical validation trial with 120 patients at Kollam District Hospital"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Rural Health",
        headline: "Non-Invasive Hemoglobin Testing Without Needles",
        body: [
          "Anemia affects over 50% of rural women in India. Traditional testing requires sterile needles, chemical reagents, and lab technicians.",
          "The MedTech team engineered a multi-wavelength LED fingertip sensor that analyzes spectral absorption through capillary beds.",
          "Results correlate strongly with laboratory hematology analyzers while producing instant readouts at zero consumable cost."
        ],
        callout: "Clearance received for Phase 2 clinical accuracy trials.",
        author: "By Biomedical Research Cell"
      }
    ]
  },
  {
    id: "edition-7",
    issue: 7,
    issueNo: "Issue #7",
    title: "Cyber Defense",
    subtitle: "Firmware Security & Hardware Hacking",
    date: "April 2025",
    month: "April",
    year: "2025",
    category: "Cybersecurity",
    tier: 3,
    angleIndex: 5,
    readTime: "5 min read",
    author: "Ashwin K. (Security Lead)",
    theme: "Zero Trust Architecture for Embedded Hardware",
    icon: "🛡️",
    color: "#7c3aed",
    accent: "rgba(124, 58, 237, 0.2)",
    spineColor: "#581c87",
    coverStyle: "plum",
    summary: "Auditing UART, JTAG, and SPI flash buses on smart consumer devices to identify firmware extraction vulnerabilities.",
    excerpt: "Why hardware engineers must implement cryptographic bootloaders and encrypted storage from day one.",
    content: "Demonstration of side-channel power analysis attacks and fault injection defenses on Cortex-M microcontrollers.",
    highlights: [
      "Secure boot configuration on ESP32 and STM32 chips",
      "Preventing firmware extraction via JTAG pin disabling",
      "Hardware security module (HSM) key storage best practices"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Hardware Security",
        headline: "Why Connected Hardware Needs Hardware-Level Security",
        body: [
          "Connecting any physical device to the Internet creates an attack surface that can compromise entire industrial or residential networks.",
          "Our cybersecurity team demonstrated how easily unencrypted SPI flash chips can be dumped with an inexpensive logic analyzer.",
          "By implementing cryptographic eFuse locking and AES-XTS flash encryption, physical hardware tampering is completely neutralized."
        ],
        callout: "Best Paper Award at National Cyber Defense Workshop 2025.",
        author: "By Cyber Research Group"
      }
    ]
  },

  // --- TIER 4 (BOTTOM TIER: Issues #6 - #1, 2024-2025) ---
  {
    id: "edition-6",
    issue: 6,
    issueNo: "Issue #6",
    title: "Women Founders",
    subtitle: "Leadership in Technology & Ventures",
    date: "March 2025",
    month: "March",
    year: "2025",
    category: "Community",
    tier: 4,
    angleIndex: 0,
    readTime: "5 min read",
    author: "Women in Tech Chapter",
    theme: "Diversity in Engineering Entrepreneurship",
    icon: "👩‍💻",
    color: "#d97706",
    accent: "rgba(217, 119, 6, 0.2)",
    spineColor: "#78350f",
    coverStyle: "amber",
    summary: "Profiles of female student founders leading robotics, AI, and environmental startups at BMCE.",
    excerpt: "Over 45% of active project leads in the 2025 IEDC cohort are women engineers spearheading high-impact ventures.",
    content: "Interviews on breaking stereotypes in mechanical workshops, robotics hackathons, and venture pitching.",
    highlights: [
      "Women-led startup cohort secures ₹6 Lakhs in funding",
      "Mentorship circle launched with prominent women executives in Kerala",
      "Coding bootcamps for first-year female engineering students"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Women in Tech",
        headline: "Leading from the Front: Women in Engineering",
        body: [
          "From circuit board routing to high-torque robotics welding, women engineers at BMCE are driving foundational innovation.",
          "The Women in Tech chapter has conducted 12 technical masterclasses in Python, CAD modeling, and cloud architecture.",
          "Their hardware projects took first place in two state-level techno-cultural expos this academic year."
        ],
        callout: "45% of all IEDC executive committee positions are held by women student leaders.",
        author: "By Women in Tech Secretariat"
      }
    ]
  },
  {
    id: "edition-5",
    issue: 5,
    issueNo: "Issue #5",
    title: "Open Source",
    subtitle: "Community Software & Hardware Tools",
    date: "February 2025",
    month: "February",
    year: "2025",
    category: "Software",
    tier: 4,
    angleIndex: 1,
    readTime: "5 min read",
    author: "FOSS Cell BMCE",
    theme: "Open Science & Permissive Hardware Licenses",
    icon: "🌐",
    color: "#0284c7",
    accent: "rgba(2, 132, 199, 0.2)",
    spineColor: "#1e3a8a",
    coverStyle: "navy",
    summary: "Contributing to the Linux kernel, FreeRTOS, KiCad, and releasing campus hardware designs under CERN OHL.",
    excerpt: "Why open source collaboration accelerates student learning faster than any closed-source proprietary software.",
    content: "Guide to Git workflows, licensing under MIT/GPL/CERN OHL, and building transparent documentation.",
    highlights: [
      "Over 40 students submitted merged pull requests to upstream open source repositories",
      "KiCad library of custom Indian electrical components published",
      "FOSS hackathon saw 14 open hardware releases"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Open Source Culture",
        headline: "Build in the Open: The FOSS Movement at BMCE",
        body: [
          "The Free and Open Source Software (FOSS) Cell believes that engineering knowledge should be transparent and globally shared.",
          "Students released all schematics and firmware for the campus weather station under the CERN Open Hardware Licence.",
          "Universities in Nepal and Indonesia have already adopted the design for their own geography departments."
        ],
        callout: "The project repository has garnered 340+ GitHub stars and 80 forks.",
        author: "By FOSS Working Group"
      }
    ]
  },
  {
    id: "edition-4",
    issue: 4,
    issueNo: "Issue #4",
    title: "Eureka Jan 25",
    subtitle: "Empowering Next-Gen Student Founders",
    date: "January 2025",
    month: "January",
    year: "2025",
    category: "Foundations",
    tier: 4,
    angleIndex: 2,
    readTime: "6 min read",
    author: "Er. Ivin Saji",
    theme: "Pre-Seed Grants & Prototyping Facilities",
    icon: "📰",
    color: "#059669",
    accent: "rgba(5, 150, 105, 0.2)",
    spineColor: "#064e3b",
    coverStyle: "emerald",
    summary: "EKAH '25 Fest, CEO Mindsets, KSUM Prototype Grants, & Patent Support Guidelines.",
    excerpt: "Over 50 startup ideas and prototypes developed at IEDC BMCE during the academic year.",
    content: "Full feature covering smart EV stations, drone monitoring systems, and pre-incubation grant frameworks.",
    highlights: [
      "Editor's Desk: The Power of Student Pre-Seed Grants",
      "EKAH '25: Techno-Cultural Innovation Showcase",
      "Startup Spotlight: EcoCharge Smart EV Charger",
      "Agri-Tech Breakthrough: Drone Crop Health Monitor"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "Cover & Vision",
        headline: "Empowering Next-Gen Student Founders",
        body: [
          "Welcome to the January 2025 edition of Eureka, the flagship publication of IEDC BMCE.",
          "Over the past semester, our students have transformed classroom concepts into functional hardware prototypes, pre-seed backed ventures, and patented designs.",
          "From smart EV stations to AI-powered agricultural monitoring drones, BMCE engineers are actively reshaping the technological landscape."
        ],
        callout: "Over 50+ startup ideas and prototypes were developed at IEDC BMCE this academic year!"
      }
    ]
  },
  {
    id: "edition-3",
    issue: 3,
    issueNo: "Issue #3",
    title: "Eureka Dec 24",
    subtitle: "2024 Innovation Milestone Review",
    date: "December 2024",
    month: "December",
    year: "2024",
    category: "Milestones",
    tier: 4,
    angleIndex: 3,
    readTime: "5 min read",
    author: "Editorial Council",
    theme: "Incubator Success Stories & Hardware Recaps",
    icon: "🚀",
    color: "#b91c1c",
    accent: "rgba(185, 28, 28, 0.2)",
    spineColor: "#7f1d1d",
    coverStyle: "crimson",
    summary: "Reflecting on 25+ technical bootcamps, 500+ active student innovators, and over ₹10 Lakhs in grant support generated.",
    excerpt: "The foundation year that established the FabLab Maker Space and dedicated IoT prototyping benches.",
    content: "Year-end celebratory retrospective covering departmental achievements and faculty nodal mentorship.",
    highlights: [
      "Reflecting on 25+ technical bootcamps",
      "500+ active student innovators engaged",
      "Over ₹10 Lakhs in total grant support generated",
      "Faculty leadership spotlight with Nodal Officers"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
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
    id: "edition-2",
    issue: 2,
    issueNo: "Issue #2",
    title: "KSUM Special",
    subtitle: "Grant Funding & Incubation Guide",
    date: "November 2024",
    month: "November",
    year: "2024",
    category: "Funding Guide",
    tier: 4,
    angleIndex: 4,
    readTime: "5 min read",
    author: "Nodal Officers",
    theme: "Roadmap to Government Pre-Seed Grants",
    icon: "💡",
    color: "#0f172a",
    accent: "rgba(15, 23, 42, 0.2)",
    spineColor: "#18181b",
    coverStyle: "obsidian",
    summary: "KSUM Idea Grants up to ₹2 Lakhs, Prototyping Labs, & Pre-Seed Funding Roadmap.",
    excerpt: "A comprehensive manual for student teams applying for non-dilutive government innovation grants.",
    content: "Step-by-step instructions on drafting eligibility criteria, project proposals, milestones, and fund utilization reports.",
    highlights: [
      "Step-by-step roadmap for funding applications",
      "Patent protection rules for student inventors",
      "Accessing Kerala Startup Mission mentor networks",
      "Legal fundamentals of incorporation"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
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
  },
  {
    id: "edition-1",
    issue: 1,
    issueNo: "Issue #1",
    title: "Inception",
    subtitle: "The Genesis of IEDC BMCE Hub",
    date: "October 2024",
    month: "October",
    year: "2024",
    category: "Foundations",
    tier: 4,
    angleIndex: 5,
    readTime: "5 min read",
    author: "Founding Committee",
    theme: "Founding the Innovation & Entrepreneurship Centre",
    icon: "🏛️",
    color: "#7c3aed",
    accent: "rgba(124, 58, 237, 0.2)",
    spineColor: "#581c87",
    coverStyle: "plum",
    summary: "The inaugural charter of the Innovation & Entrepreneurship Development Centre at Baselios Mathews II College of Engineering.",
    excerpt: "How a shared vision among passionate faculty and student innovators created the college's first dedicated startup incubator.",
    content: "The founding mission statement: Empowering every engineering graduate with entrepreneurial capability and technical mastery.",
    highlights: [
      "The Founding Charter of IEDC BMCE",
      "Inauguration by Kerala Startup Mission dignitaries",
      "Setting up the first campus hardware prototyping bench"
    ],
    pdfUrl: "https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing",
    pages: [
      {
        pageNumber: 1,
        title: "The Inception",
        headline: "Where Engineering Curiosity Meets Market Execution",
        body: [
          "On October 12, 2024, the Innovation & Entrepreneurship Development Centre (IEDC) at Baselios Mathews II College of Engineering was formally inaugurated.",
          "Our mission is simple yet audacious: to ensure no student with a viable engineering concept is ever held back by lack of tools, mentorship, or early-stage capital.",
          "We welcome every engineer, tinkerer, and creator to make this incubator their creative home."
        ],
        callout: "The journey of a thousand innovations begins with a single prototype.",
        author: "By Founding Council"
      }
    ]
  }
];
