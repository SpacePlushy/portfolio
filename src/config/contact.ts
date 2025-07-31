// Contact information configuration with environment variable support
export interface ContactInfo {
  email: string;
  phone: {
    raw: string;
    formatted: string;
  };
  linkedin: {
    url: string;
    display: string;
  };
}

// Environment variables with fallback values
export const CONTACT_INFO: ContactInfo = {
  email: import.meta.env.CONTACT_EMAIL || 'frank@palmisano.io',
  phone: {
    raw: import.meta.env.CONTACT_PHONE_RAW || '+16233005532',
    formatted: import.meta.env.CONTACT_PHONE_FORMATTED || '(623) 300-5532',
  },
  linkedin: {
    url: import.meta.env.CONTACT_LINKEDIN_URL || 'https://www.linkedin.com/in/frank-palmisano',
    display: import.meta.env.CONTACT_LINKEDIN_DISPLAY || 'www.linkedin.com/in/frank-palmisano',
  },
};
