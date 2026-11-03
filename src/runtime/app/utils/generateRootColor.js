export default (name, red, green, blue) => {
  const colorVariables = {
    [`${name}-50`]: [
      Math.round(red + 24),
      Math.round(green + 24),
      Math.round(blue + 24),
    ],
    [`${name}-100`]: [
      Math.round(red + 20),
      Math.round(green + 20),
      Math.round(blue + 20),
    ],
    [`${name}-200`]: [
      Math.round(red + 15),
      Math.round(green + 15),
      Math.round(blue + 15),
    ],
    [`${name}-300`]: [
      Math.round(red + 10),
      Math.round(green + 10),
      Math.round(blue + 10),
    ],
    [`${name}-400`]: [Math.round(red), Math.round(green), Math.round(blue)],
    [`${name}-500`]: [
      Math.round(red - 10),
      Math.round(green - 10),
      Math.round(blue - 10),
    ],
    [`${name}-600`]: [
      Math.round(red - 15),
      Math.round(green - 15),
      Math.round(blue - 15),
    ],
    [`${name}-700`]: [
      Math.round(red - 20),
      Math.round(green - 20),
      Math.round(blue - 20),
    ],
    [`${name}-800`]: [
      Math.round(red - 25),
      Math.round(green - 25),
      Math.round(blue - 25),
    ],
    [`${name}-900`]: [
      Math.round(red - 30),
      Math.round(green - 30),
      Math.round(blue - 30),
    ],
    [`${name}-950`]: [
      Math.round(red - 95),
      Math.round(green - 95),
      Math.round(blue - 95),
    ],
    [`${name}-950`]: [
      Math.round(red - 95),
      Math.round(green - 95),
      Math.round(blue - 95),
    ],
  };

  let cssString = `:root {\n`;

  for (const key in colorVariables) {
    if (colorVariables.hasOwnProperty(key)) {
      const value = colorVariables[key];
      cssString += `  ${key}: ${value[0]} ${value[1]} ${value[2]};\n`;
    }
  }

  cssString += `}`;

  return cssString;
};
