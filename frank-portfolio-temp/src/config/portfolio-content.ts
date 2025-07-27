export interface PortfolioContent {
  metadata: {
    title: string
    description: string
    keywords: string[]
  }
  hero: {
    name: string
    title: string
    tagline: string
    email: string
    phone: string
    linkedin: string
  }
  about: {
    heading: string
    summary: string
    stats: Array<{
      label: string
      value: string
    }>
  }
  experience: Array<{
    title: string
    company: string
    period: string
    location: string
    description: string[]
    technologies?: string[]
  }>
  skills: {
    heading: string
    categories: Array<{
      name: string
      items: Array<{
        name: string
        level: 'Expert' | 'Advanced' | 'Intermediate'
      }>
    }>
  }
  achievements: Array<{
    title: string
    description: string
    impact?: string
  }>
  education: Array<{
    degree: string
    school: string
    period: string
    location: string
  }>
  certifications?: Array<{
    name: string
    issuer: string
    year: string
  }>
}

export const portfolioContent: Record<'general' | 'swe' | 'csr', PortfolioContent> = {
  general: {
    metadata: {
      title: "Frank Palmisano - Professional Portfolio",
      description: "Versatile professional with expertise in both software engineering and customer service excellence. Explore my diverse skill set and achievements.",
      keywords: ["Frank Palmisano", "professional", "software engineer", "customer service", "NASA", "Apple", "Arizona", "portfolio"]
    },
    hero: {
      name: "Frank Palmisano",
      title: "Professional Portfolio",
      tagline: "Customer Service Excellence • Software Engineering • Problem Solving",
      email: "frank@palmisano.io",
      phone: "(623) 300-5532",
      linkedin: "https://linkedin.com/in/frankpalmisano"
    },
    about: {
      heading: "About Me",
      summary: "A versatile professional with a unique blend of technical expertise and customer-focused excellence. With experience spanning from NASA spacecraft development to achieving 99% customer satisfaction ratings, I bring both analytical problem-solving skills and exceptional interpersonal abilities to every challenge.",
      stats: [
        { label: "Years Experience", value: "10+" },
        { label: "NASA Project", value: "Orion Spacecraft" },
        { label: "Customer Satisfaction", value: "99%" },
        { label: "Industry Recognition", value: "Top 4%" }
      ]
    },
    experience: [
      {
        title: "Software Engineer & Technical Professional",
        company: "Multiple Organizations",
        period: "2014 - Present",
        location: "Phoenix, Arizona",
        description: [
          "Developed mission-critical software for NASA's Orion spacecraft program",
          "Achieved 99% customer satisfaction rating in technical support roles",
          "Led teams and training initiatives across multiple domains",
          "Consistently exceeded performance metrics in both technical and service roles"
        ]
      }
    ],
    skills: {
      heading: "Core Competencies",
      categories: [
        {
          name: "Technical Skills",
          items: [
            { name: "Software Development", level: "Expert" },
            { name: "Problem Solving", level: "Expert" },
            { name: "System Architecture", level: "Advanced" },
            { name: "Technical Communication", level: "Expert" }
          ]
        },
        {
          name: "Professional Skills",
          items: [
            { name: "Customer Relations", level: "Expert" },
            { name: "Team Leadership", level: "Advanced" },
            { name: "Project Management", level: "Advanced" },
            { name: "Training & Mentoring", level: "Advanced" }
          ]
        }
      ]
    },
    achievements: [
      {
        title: "NASA Orion Spacecraft Contributor",
        description: "Contributed to mission-critical software for human space exploration",
        impact: "Advancing human spaceflight capabilities"
      },
      {
        title: "Customer Service Excellence",
        description: "Achieved 99% satisfaction rating and top 4% national ranking",
        impact: "Exceptional customer experience delivery"
      },
      {
        title: "Cross-Domain Expertise",
        description: "Successfully excelled in both technical and service-oriented roles",
        impact: "Versatile problem-solving across industries"
      }
    ],
    education: [
      {
        degree: "B.S. in Computer Science",
        school: "Arizona State University",
        period: "2014 - 2018",
        location: "Tempe, Arizona"
      }
    ]
  },
  swe: {
    metadata: {
      title: "Frank Palmisano - Software Engineer",
      description: "Software Engineer specializing in embedded systems, virtualization, and aerospace software development. NASA Orion Spacecraft contributor.",
      keywords: ["software engineer", "embedded systems", "virtualization", "NASA", "Orion", "aerospace", "React", "TypeScript", "Next.js", "Python", "C++"]
    },
    hero: {
      name: "Frank Palmisano",
      title: "Software Engineer",
      tagline: "Embedded Systems • Virtualization • NASA Orion Spacecraft",
      email: "frank@palmisano.io",
      phone: "(623) 300-5532",
      linkedin: "https://linkedin.com/in/frankpalmisano"
    },
    about: {
      heading: "About Me",
      summary: "I'm a software engineer with a passion for building robust systems that power critical infrastructure. My work spans from embedded systems in aerospace to modern web applications, always focusing on reliability, performance, and clean architecture.",
      stats: [
        { label: "NASA Project", value: "Orion Spacecraft" },
        { label: "Cost Savings", value: "$2.4M" },
        { label: "Experience", value: "6+ Years" },
        { label: "Specialization", value: "Embedded Systems" }
      ]
    },
    experience: [
      {
        title: "Software Engineer II",
        company: "Honeywell",
        period: "May 2018 - June 2024",
        location: "Phoenix, Arizona",
        description: [
          "Lead developer for NASA Orion spacecraft life support software",
          "Architected real-time embedded systems for critical spacecraft operations",
          "Developed virtualization solutions saving $2.4M in testing infrastructure",
          "Mentored junior engineers and led code review sessions"
        ],
        technologies: ["C++", "Python", "RTOS", "Virtualization", "Embedded Systems"]
      },
      {
        title: "Software Engineer Intern",
        company: "Honeywell",
        period: "May 2017 - May 2018",
        location: "Phoenix, Arizona",
        description: [
          "Developed automated testing frameworks for aerospace systems",
          "Contributed to flight software verification and validation",
          "Collaborated with NASA engineers on system requirements"
        ],
        technologies: ["Python", "C", "Jenkins", "Git"]
      }
    ],
    skills: {
      heading: "Technical Skills",
      categories: [
        {
          name: "Programming Languages",
          items: [
            { name: "Python", level: "Expert" },
            { name: "C++", level: "Expert" },
            { name: "TypeScript", level: "Advanced" },
            { name: "JavaScript", level: "Advanced" },
            { name: "C", level: "Advanced" },
            { name: "Rust", level: "Intermediate" }
          ]
        },
        {
          name: "Technologies & Frameworks",
          items: [
            { name: "React/Next.js", level: "Advanced" },
            { name: "Node.js", level: "Advanced" },
            { name: "Docker", level: "Advanced" },
            { name: "Embedded Systems", level: "Expert" },
            { name: "RTOS", level: "Expert" },
            { name: "Git", level: "Expert" }
          ]
        }
      ]
    },
    achievements: [
      {
        title: "NASA Orion Life Support System",
        description: "Lead developer for critical spacecraft life support software",
        impact: "Ensuring astronaut safety on deep space missions"
      },
      {
        title: "$2.4M Cost Savings",
        description: "Architected virtualization solution for hardware testing",
        impact: "Reduced testing infrastructure costs by 75%"
      },
      {
        title: "Real-time System Architecture",
        description: "Designed fault-tolerant embedded systems for aerospace",
        impact: "Zero critical failures in 6+ years of operation"
      }
    ],
    education: [
      {
        degree: "B.S. in Computer Science",
        school: "Arizona State University",
        period: "2014 - 2018",
        location: "Tempe, Arizona"
      }
    ]
  },
  csr: {
    metadata: {
      title: "Frank Palmisano - Customer Service Representative",
      description: "Customer Service Representative with 99% satisfaction rate, specializing in technical support, client relations, and customer success. Apple Top 4% nationally.",
      keywords: ["customer service", "technical support", "customer success", "Apple advisor", "HIPAA", "Salesforce", "Zendesk", "client relations", "customer satisfaction"]
    },
    hero: {
      name: "Frank Palmisano",
      title: "Customer Service Representative",
      tagline: "Customer Success • Technical Support • 99% CSAT",
      email: "frank@palmisano.io",
      phone: "(623) 300-5532",
      linkedin: "https://linkedin.com/in/frankpalmisano"
    },
    about: {
      heading: "About Me",
      summary: "Empathy-driven support professional with a 99% customer-satisfaction history (Apple) and a current 4.97-star customer rating across Amazon Flex and Uber. Known for mastering new tools quickly, documenting interactions with 100% accuracy, and exceeding first-contact-resolution goals in high-volume environments. Six years coordinating complex, multi-department issues at Honeywell sharpened my ability to translate technical details into clear next steps for customers. HIPAA-trained, fluent in Salesforce Service Cloud, Zendesk, and Microsoft Office.",
      stats: [
        { label: "Customer Satisfaction", value: "99%" },
        { label: "Apple Ranking", value: "Top 4%" },
        { label: "Current Rating", value: "4.97★" },
        { label: "Service Awards", value: "16" }
      ]
    },
    experience: [
      {
        title: "Delivery Partner",
        company: "Amazon",
        period: "February 2023 - Present",
        location: "Phoenix, Arizona",
        description: [
          "Completed 1,400+ deliveries with a 4.97-star rating and 99% on-time rate",
          "Resolved real-time customer issues via in-app chat/voice maintaining < 1% complaint rate",
          "Educated customers on in-app self-service steps to prevent repeat contacts",
          "Demonstrated empathy and clear communication with diverse seniors and caregivers receiving time-sensitive packages"
        ]
      },
      {
        title: "Customer Service Advisor",
        company: "Apple",
        period: "June 2014 - December 2014",
        location: "(Remote) Phoenix, Arizona",
        description: [
          "Handled 75–90 daily contacts via phone and chat, sustaining a 99% CSAT",
          "Ranked in Apple's top 4% nationally and earned 16 Outstanding Customer Service Awards",
          "Guided customers through AppleCare coverage and educated on self-service options",
          "Met or beat AHT targets for nine consecutive months",
          "Authored 30+ knowledge-base articles that cut average handle time 12% and boosted first-contact resolution"
        ]
      },
      {
        title: "Software Engineer II/Technical Liaison",
        company: "Honeywell",
        period: "May 2018 - June 2024",
        location: "Phoenix, Arizona",
        description: [
          "Primary point of contact to NASA Orion program engineers",
          "Reduced issue-turnaround 64% by synthesizing data from multiple systems",
          "Led 14 remote training sessions that improved team accuracy and reduced follow-up questions 35%",
          "Logged, tracked and reported all client interactions in Jira/Confluence"
        ]
      }
    ],
    skills: {
      heading: "Core Competencies",
      categories: [
        {
          name: "Customer Service Excellence",
          items: [
            { name: "First-Contact Resolution", level: "Expert" },
            { name: "De-escalation & Conflict Resolution", level: "Expert" },
            { name: "Empathy & Active Listening", level: "Expert" },
            { name: "Customer Satisfaction (CSAT)", level: "Expert" },
            { name: "Average Handle Time (AHT)", level: "Expert" },
            { name: "Cross-functional Collaboration", level: "Advanced" }
          ]
        },
        {
          name: "Technical Proficiencies",
          items: [
            { name: "Salesforce Service Cloud", level: "Advanced" },
            { name: "Zendesk", level: "Advanced" },
            { name: "Microsoft Office Suite", level: "Advanced" },
            { name: "Omnichannel Support", level: "Expert" },
            { name: "CRM Systems", level: "Advanced" },
            { name: "HIPAA Compliance", level: "Advanced" }
          ]
        }
      ]
    },
    achievements: [
      {
        title: "Apple Top 4% Nationally",
        description: "Ranked in the top 4% of Apple Customer Service Advisors nationwide",
        impact: "Consistently exceeded performance metrics and customer satisfaction goals"
      },
      {
        title: "99% Customer Satisfaction",
        description: "Maintained 99% CSAT rating across high-volume support interactions",
        impact: "Built lasting customer loyalty and trust"
      },
      {
        title: "16 Outstanding Service Awards",
        description: "Received 16 Outstanding Customer Service Awards at Apple",
        impact: "Recognized for exceptional dedication to customer success"
      },
      {
        title: "Knowledge Base Contributor",
        description: "Authored 30+ articles that reduced average handle time by 12%",
        impact: "Improved team efficiency and first-contact resolution rates"
      },
      {
        title: "Process Improvement Leader",
        description: "Reduced issue turnaround time by 64% at Honeywell",
        impact: "Enhanced customer experience and operational efficiency"
      }
    ],
    education: [
      {
        degree: "B.S. in Computer Science",
        school: "Arizona State University",
        period: "2014 - 2018",
        location: "Tempe, Arizona"
      }
    ],
    certifications: [
      {
        name: "HIPAA for Customer Support Personnel",
        issuer: "LinkedIn Learning",
        year: "2025"
      },
      {
        name: "Salesforce Service Cloud & Zendesk Refresher",
        issuer: "Self-Study",
        year: "2025"
      }
    ]
  }
}