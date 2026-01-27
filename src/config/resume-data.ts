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
    title: 'Infrastructure Engineer & Linux Systems Administrator',
    tagline:
      '6 years managing Linux infrastructure and VMware environments for NASA aerospace programs. Expertise in RHEL administration, Python/Bash automation, system hardening, and maintaining 99%+ uptime on mission-critical systems. Available immediately.',
    location: 'Phoenix, Arizona',
    email: 'frank@palmisano.io',
    phone: '(623) 300-5532',
    linkedin: 'https://www.linkedin.com/in/frank-palmisano',
    github: 'https://github.com/spaceplushy',
    website: null,
  },

  about: {
    summary:
      'Infrastructure Engineer with 6 years administering Linux-based test environments and VMware infrastructure at Honeywell Aerospace, supporting NASA ISS and Orion Space Capsule programs. Proven expertise in RHEL configuration, performance tuning, patching, and security hardening with 99%+ system uptime. Developed Python and Bash automation tools that improved operational efficiency by 40%. Experienced in VM lifecycle management, system image maintenance, backup and recovery, and cross-functional collaboration with engineering teams. B.S. Computer Science from Arizona State University (3.60 GPA). Seeking Infrastructure Engineer or Systems Administrator role to leverage enterprise Linux and virtualization experience.',
    highlights: [
      '6 years administering Linux-based test environments for NASA ISS and Orion programs with 99%+ uptime',
      'Managed VMware virtualization infrastructure including VM deployment, snapshots, backup and recovery',
      'Developed Python and Bash automation tools improving operational efficiency by 40%',
      'RHEL configuration, performance tuning, patching, and security hardening in aerospace environments',
      'Provided Tier 1-2 technical support troubleshooting hardware and software across Linux and Windows systems',
      'Created and maintained technical documentation including system configurations, SOPs, and troubleshooting guides',
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
        'Linux infrastructure administration and systems support for NASA programs including ISS and Orion missions, focusing on system reliability, virtualization management, and automation for mission-critical aerospace environments.',
      achievements: [
        'Administered Linux-based test environments for NASA ISS and Orion Space Capsule programs, ensuring system stability, availability, and 99%+ uptime for engineering teams',
        'Managed VMware virtualization infrastructure including system backups, VM deployment, snapshots, and maintenance of test equipment images across multiple facilities',
        'Developed Python automation tools that improved testing and operational efficiency by 40%, streamlining system configuration and validation workflows',
        'Created and executed Bash scripts for system administration tasks including log management, monitoring, and deployment workflows, reducing manual configuration time by 50%',
        'Applied security hardening practices in ITAR-controlled aerospace environment including access control, file integrity validation using checksums, and export compliance',
        'Provided Tier 1-2 technical support troubleshooting hardware and software issues on test equipment, development workstations, and Linux/Windows systems',
        'Maintained test environment infrastructure supporting distributed engineering teams, configuring and managing equipment for continuous availability',
        'Created and maintained technical documentation including system configurations, troubleshooting guides, and standard operating procedures',
        'Executed validation procedures and test scripts for Programmable Modular Test Equipment (PMTE), documenting results and tracking defects through resolution',
        'Collaborated with cross-functional engineering teams on software releases, system deployments, and infrastructure maintenance',
        'Worked with Simics virtualization environment for embedded systems and supported LabVIEW-based testing frameworks',
        'Implemented hardware and software solutions to address obsolescence issues within the ISS program',
      ],
      technologies: [
        'Linux/RHEL',
        'VMware vSphere',
        'Python',
        'Bash',
        'Windows Server',
        'Git',
        'Simics',
        'LabVIEW',
        'PMTE',
      ],
    },
    {
      company: 'Life Jewel Technologies',
      position: 'Founder & iOS Developer',
      location: 'Tempe, Arizona',
      startDate: 'January 2017',
      endDate: 'May 2018',
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
      startDate: 'June 2016',
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
        'Provided technical support and troubleshooting for customer hardware/software issues, resolving 110+ cases daily',
        'Received multiple awards for customer service excellence and technical problem resolution',
        'Became go-to resource for complex technical problem-solving among 15-member team',
      ],
      technologies: ['macOS', 'iOS', 'Apple Hardware', 'Customer Support Tools'],
    },
  ],

  skills: {
    languages: ['Python', 'Bash', 'Swift', 'Objective-C', 'C', 'PowerShell fundamentals'],
    frameworks: [
      'VMware vSphere',
      'VirtualBox',
      'Docker (personal projects)',
      'Reverse Proxy Configuration',
    ],
    testing: [
      'System Validation',
      'Checksum Verification',
      'Root Cause Analysis',
      'Performance Monitoring',
      'Regression Testing',
      'Test Case Execution',
      'Bug Documentation',
    ],
    tools: [
      'Linux/RHEL/Ubuntu',
      'VMware',
      'VirtualBox',
      'Git',
      'ClearCase',
      'JIRA',
      'SSH/Terminal',
      'LabVIEW',
      'Simics',
      'PMTE',
    ],
    methodologies: [
      'Linux System Administration',
      'Infrastructure Maintenance',
      'Security Hardening',
      'ITAR/Export Compliance',
      'Agile/Scrum',
      'Technical Documentation',
      'Cross-functional Collaboration',
      'Backup and Recovery',
      'Performance Tuning',
      'Incident Response',
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
      name: 'Infrastructure Automation Suite',
      description:
        'Python and Bash automation tools for Linux infrastructure management at Honeywell Aerospace. Automated system configuration, file integrity validation, and deployment workflows for NASA program environments.',
      technologies: ['Python', 'Bash', 'Linux/RHEL', 'VMware', 'Checksum Verification'],
      highlights: [
        'Developed Python-based automation tools for system configuration and file integrity validation across aerospace test environments',
        'Automated deployment workflows and checksum verification ensuring 100% configuration accuracy across multiple environments',
        'Improved operational efficiency by 40% through systematic automation of manual infrastructure tasks',
        'Tools utilized across multiple NASA program environments supporting ISS and Orion missions',
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
    pageTitle: 'Frank Palmisano - Infrastructure Engineer & Linux Systems Administrator',
    metaDescription:
      'Professional portfolio of Frank Palmisano, Infrastructure Engineer with 6 years experience in Linux administration, VMware virtualization, and Python automation for NASA aerospace programs.',
    keywords: [
      'Infrastructure Engineer',
      'Linux Systems Administrator',
      'RHEL',
      'Red Hat Enterprise Linux',
      'VMware',
      'Python Automation',
      'Bash Scripting',
      'System Administration',
      'Linux Infrastructure',
      'NASA Programs',
      'Aerospace',
      'Security Hardening',
      'Virtualization',
      'Phoenix Arizona',
      'Honeywell Aerospace',
      'DevOps',
      'IT Infrastructure',
      'Systems Engineer',
    ],
  },
};
