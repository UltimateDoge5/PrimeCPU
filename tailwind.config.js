/** @type {import("tailwindcss").Config} */
module.exports = {
	content: [
		"./src/app/**/*.tsx",
		"./src/components/**/*.tsx",
		"./src/util/**/*.{ts,tsx}",
	],
	theme: {
		extend: {
			colors: {
				'text': '#131706',
				'background': '#eeefe9',
				'primary': '#eac53e',
				'secondary': '#8adf8a',
				'accent': '#70d892',
			},
			backgroundImage: {
				"gradient": "linear-gradient(153deg, rgba(3,105,161,1) 0%, rgba(0,8,13,1) 41%, rgba(0,0,0,1) 53%, rgba(109,40,217,1) 100%)"
			},
		}
	},
	plugins: []
};