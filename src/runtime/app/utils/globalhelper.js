// utils/globalHelper.js

export default function globalHelper() {
    return {
      str: {
        capitalize: (text) => text.charAt(0).toUpperCase() + text.slice(1),
        truncate: (text, length) => text.length > length ? text.slice(0, length) + '...' : text,
      },
      config: {
        appName: 'MyApp',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      api: {
        fetchData: async (url, options = {}) => {
          const response = await fetch(url, options);
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        },
        postData: async (url, data, options = {}) => {
          const response = await fetch(url, {
            ...options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...options.headers },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        },
      },
    };
  }
  