// Resume data configuration for Software Engineer portfolio

export interface PersonalInfo {
  name: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string | null;
}

export interface AboutInfo {
  summary: string;
  highlights: string[];
}

export interface Experience {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface Skills {
  languages: string[];
  frameworks: string[];
  testing: string[];
  tools: string[];
  methodologies: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
  graduationMonth: string;
  honors: string;
  gpa: string;
  additionalDetails: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  highlights: string[];
  url: string | null;
  github: string | null;
  context: string;
}

export interface SEO {
  pageTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface ResumeData {
  personal: PersonalInfo;
  about: AboutInfo;
  experience: Experience[];
  skills: Skills;
  education: Education[];
  certifications: string[];
  projects: Project[];
  seo: SEO;
}

export const RESUME_DATA: ResumeData = {
  personal: {
    name: 'Frank Palmisano',
    title: 'Validation Engineer & QA Specialist',
    tagline:
      '6 years aerospace validation experience supporting NASA programs with expertise in Python automation, Linux systems, and systematic test execution. Available immediately for contract or direct hire positions.',
    location: 'Phoenix, Arizona',
    email: 'frank@palmisano.io',
    phone: '(623) 300-5532',
    linkedin: 'https://www.linkedin.com/in/frank-palmisano',
    github: 'https://github.com/spaceplushy',
    website: null,
  },

  about: {
    summary:
      'Validation Engineer with 6 years of hands-on aerospace test equipment validation at Honeywell supporting NASA programs. Proven expertise in systematic test execution, Python scripting for automation, Linux system administration, and infrastructure maintenance. Developed file integrity validation tools using checksum verification, troubleshot complex technical systems, and maintained test environments with 99%+ uptime. Built and shipped production iOS application as sole developer. B.S. Computer Science from Arizona State University (3.60 GPA). Seeking Validation Engineer or QA Engineer position to leverage aerospace validation discipline and technical problem-solving skills.',
    highlights: [
      '6 years executing systematic validation procedures on aerospace test equipment for NASA ISS and Orion programs',
      'Developed automated validation tools improving efficiency by 40% while maintaining aerospace quality standards',
      'Administered Linux systems for 6 years with 99%+ uptime supporting mission-critical NASA validation activities',
      'Shipped production iOS application as sole developer demonstrating complete software lifecycle capability',
      'Created 30+ automation scripts (Python and Bash) reducing manual configuration time by 50%',
      'Reduced test failure rates by 25% through systematic troubleshooting and root cause analysis',
    ],
  },

  experience: [
    {
      company: 'Honeywell Aerospace',
      position: 'Software Engineer (Test Equipment Support)',
      location: 'Phoenix, Arizona',
      startDate: 'May 2018',
      endDate: 'June 2024',
      description:
        'Test equipment support and validation engineer for NASA programs including ISS and Orion missions, focusing on system validation, test infrastructure, and quality assurance for mission-critical aerospace systems.',
      achievements: [
        'Developed Python-based file validation software using checksum verification to ensure system integrity across multiple test environments for NASA ISS and Orion programs, improving validation efficiency by 40%',
        'Executed comprehensive validation procedures on aerospace test equipment, documenting test results and system configurations for engineering teams supporting mission-critical NASA missions',
        'Validated software installations and configurations on specialized test equipment (Programmable Modular Test Equipment - PMTE), ensuring 100% compliance with aerospace quality standards',
        'Troubleshot hardware and software issues during test execution, performing root cause analysis and implementing corrective actions that reduced failure rates by 25%',
        'Administered Linux-based test systems for 6 years, performing system virtualization and backups using VMware with 99%+ uptime for mission-critical validation activities',
        'Created and executed Python and Bash automation scripts for system validation and equipment setup, reducing manual configuration time by 50%',
        'Maintained test environment infrastructure supporting distributed engineering teams across multiple Honeywell facilities',
        'Configured and managed test equipment ensuring continuous availability for NASA program validation requirements',
        'Gained familiarity with real-time operating systems (RTOS) supporting Orion capsule simulation projects',
        'Worked with Simics virtualization environment for embedded systems validation',
        'Supported LabVIEW-based testing frameworks for Control Moment Gyroscope equipment',
        'Collaborated with cross-functional engineering teams on test execution and data collection for complex aerospace systems',
      ],
      technologies: [
        'Python',
        'Bash',
        'Linux/Unix',
        'VMware',
        'RTOS',
        'Simics',
        'LabVIEW',
        'PMTE',
        'Git',
      ],
    },
    {
      company: 'Life Jewel Technologies',
      position: 'Co-founder and Chief Technology Officer',
      location: 'Tempe, Arizona',
      startDate: 'December 2016',
      endDate: 'June 2017',
      description:
        'Co-founded language learning technology startup and served as sole engineer, building and shipping production iOS application from concept to App Store deployment.',
      achievements: [
        'Sole engineer: Developed and shipped production iOS application to App Store using Swift and Objective-C, managing complete technical delivery from concept to deployment',
        'Implemented Bluetooth Low Energy (BLE) iBeacon technology for object recognition and language learning features',
        'Created cross-platform compatibility strategy for Android and Windows Phone OS',
        'Managed full software development lifecycle including requirements gathering, development, testing, and deployment',
        'Successfully brought product to market, demonstrating ability to deliver complete software solutions independently',
      ],
      technologies: [
        'Swift',
        'Objective-C',
        'iOS',
        'Bluetooth Low Energy (BLE)',
        'iBeacon',
        'Xcode',
        'App Store',
      ],
    },
    {
      company: 'Performance Software Corporation',
      position: 'Software Engineering Intern',
      location: 'Phoenix, Arizona',
      startDate: 'July 2016',
      endDate: 'October 2016',
      description:
        'Software engineering internship focused on test automation and validation for Northrop Grumman aerospace projects.',
      achievements: [
        'Developed Python validation and test scripts for Northrop Grumman Blackhawk Helicopter project, automating repetitive testing tasks',
        "Created automated validation tools that improved team's script creation efficiency by 38%, reducing test execution time from 4 hours to 2.5 hours per cycle",
        'Executed unit tests using real-time operating systems and testing suites, identifying and documenting 15+ critical defects',
        'Documented validation results and provided technical recommendations to engineering team, improving testing processes',
        'Completed assigned validation tasks ahead of schedule through efficient Python scripting and systematic approach',
      ],
      technologies: ['Python', 'Unit Testing', 'RTOS', 'Test Automation'],
    },
    {
      company: 'Apple Inc.',
      position: 'Advisor',
      location: 'Tempe, Arizona',
      startDate: 'June 2014',
      endDate: 'December 2014',
      description:
        'Provided technical support and troubleshooting for Apple customers, serving as technical expert for hardware and software issues.',
      achievements: [
        'Provided technical support and troubleshooting for customer hardware/software issues, resolving 30+ cases daily',
        'Received multiple awards for customer service excellence and technical problem resolution',
        'Became go-to resource for complex technical problem-solving among 15-member team',
      ],
      technologies: ['macOS', 'iOS', 'Apple Hardware', 'Customer Support Tools'],
    },
  ],

  skills: {
    languages: ['Python', 'Swift', 'Objective-C', 'Bash', 'C', 'C++'],
    frameworks: ['iOS SDK', 'Bluetooth Low Energy (BLE)'],
    testing: [
      'pytest (learning)',
      'Unit Testing',
      'Test Automation',
      'System Validation',
      'Checksum Verification',
      'Test Case Execution',
      'Bug Documentation',
      'Root Cause Analysis',
      'Embedded System Testing',
      'Automated Testing Framework Implementation',
      'Regression Testing Strategy Development',
    ],
    tools: [
      'Linux/Unix',
      'VMware',
      'VirtualBox',
      'Git',
      'JIRA',
      'LabVIEW',
      'Simics',
      'PMTE (Programmable Modular Test Equipment)',
      'SSH/Terminal',
    ],
    methodologies: [
      'Agile',
      'Test-Driven Development (TDD)',
      'System Validation',
      'Quality Assurance',
      'Infrastructure Administration',
      'Cross-functional Collaboration',
      'Embedded Software Testing Process Optimization',
      'System Analysis',
      'Issue Identification and Resolution',
      'System Design Enhancement',
      'System Documentation Development',
      'Performance Improvement Strategies',
    ],
  },

  education: [
    {
      institution: 'Arizona State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      graduationYear: '2018',
      graduationMonth: 'May',
      honors:
        'Member of the National Society of Collegiate Scholars; Fulton Ultimate Engineering Leadership Program: First place in entrepreneurship program',
      gpa: '3.60 (Major GPA)',
      additionalDetails:
        'Led Capstone Project: Developed enterprise-level web application in 10 months with 4-person team',
    },
  ],

  certifications: [],

  projects: [
    {
      name: 'File Integrity Validation Tool',
      description:
        'Python-based checksum verification system for aerospace test environments at Honeywell. Automated validation workflow for NASA programs ensuring file integrity and system correctness.',
      technologies: ['Python', 'Checksum Verification', 'File System Automation', 'Linux'],
      highlights: [
        'Developed Python-based checksum verification system validating file integrity across aerospace test environments',
        'Automated validation workflow comparing installed files against known-good baseline, detecting 100% of configuration discrepancies',
        'Improved quality assurance validation process efficiency by 40% for test equipment configuration',
        'Tool utilized across multiple NASA program validation activities supporting ISS and Orion missions',
      ],
      url: null,
      github: null,
      context: 'Honeywell Aerospace',
    },
    {
      name: 'iOS Language Learning Application (Life Jewel)',
      description:
        'Production iOS application built as sole developer and shipped to App Store. Language learning app using Bluetooth iBeacon technology for location-based learning experiences.',
      technologies: [
        'Swift',
        'Objective-C',
        'iOS',
        'Bluetooth Low Energy (BLE)',
        'iBeacon',
        'Xcode',
      ],
      highlights: [
        'Built and shipped production iOS application to App Store as sole developer using Swift and Objective-C',
        'Implemented Bluetooth Low Energy (BLE) for iBeacon object recognition enabling location-based language learning',
        'Managed complete development process from concept to deployment including testing and App Store submission',
        'Successfully delivered production software demonstrating full-stack mobile development capability',
      ],
      url: null,
      github: null,
      context: 'Life Jewel Technologies',
    },
    {
      name: 'Python Test Automation Scripts',
      description:
        'Automated validation and test scripts for Northrop Grumman Blackhawk Helicopter aerospace project. Reduced test execution cycle time through systematic automation.',
      technologies: ['Python', 'Unit Testing', 'Test Automation', 'RTOS'],
      highlights: [
        'Developed unit test validation scripts for aerospace project automating repetitive testing tasks',
        'Reduced test execution cycle time by 38% (from 4 hours to 2.5 hours per cycle) through systematic automation',
        'Implemented validation approach ensuring comprehensive test coverage while minimizing manual effort',
        'Identified and documented 15+ critical defects through automated testing',
      ],
      url: null,
      github: null,
      context: 'Performance Software Corporation',
    },
  ],

  seo: {
    pageTitle: 'Frank Palmisano - Validation Engineer & QA Specialist Portfolio',
    metaDescription:
      'Professional portfolio of Frank Palmisano, Validation Engineer and QA Specialist with 6 years aerospace experience. Expertise in Python automation, Linux systems, test validation, and quality assurance for NASA programs.',
    keywords: [
      'Validation Engineer',
      'QA Engineer',
      'Software Engineer',
      'Test Engineer',
      'Quality Assurance',
      'Python Automation',
      'Linux System Administration',
      'Aerospace Testing',
      'NASA Programs',
      'Test Automation',
      'System Validation',
      'iOS Development',
      'Phoenix Arizona',
      'Contract to Hire',
      'Honeywell Aerospace',
      'Computer Science',
      'VMware',
      'Bash Scripting',
      'Test Infrastructure',
      'Checksum Verification',
    ],
  },
};
