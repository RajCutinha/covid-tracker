import "regenerator-runtime/runtime";
import { LitElement, css, html, query } from "lit-element";
import noUiSlider from "nouislider";
import "nouislider/distribute/nouislider.css";

class dataHandler {
	static fakeState: { covidRes: any; flagsRes: any; syncedRes: any[]; cacheTime: number; } = {
		covidRes: null,
		flagsRes: null,
		syncedRes: [],
		cacheTime: 60 * 60 * 1000,
	};

	static async getCovidData(url: string) {
		if (localStorage.cachedCovid) {
			const cacheCovid = JSON.parse(localStorage.getItem('cachedCovid'));
			const old = (new Date().getTime()) - (new Date(cacheCovid.time)) > this.fakeState.cacheTime;
			if (!old) {
				this.fakeState.covidRes = cacheCovid.data;
				return;
			} 				
		}
		try {
				const data = await fetch(url);
				const res = await data.json();
				const cache = {
				time: new Date().getTime(),
				data: res
				}
				localStorage.setItem("cachedCovid", JSON.stringify(cache));
				this.fakeState.covidRes = res;
				return res;
		} catch (err) {
			console.log(err);
		}
	}

	static async getFlagData(url: string) {
		if (localStorage.cachedFlags) {
			const cacheFlags = JSON.parse(localStorage.getItem('cachedFlags'));
			const old = (new Date().getTime()) - (new Date(cacheFlags.time)) > this.fakeState.cacheTime;
			if (!old) {
				this.fakeState.flagsRes = cacheFlags.data;
				return;
			}
		}
		try {
				const data = await fetch(url);
				const res = await data.json();
				const cache = {
				time: new Date().getTime(),
				data: res
				}
				localStorage.setItem('cachedFlags', JSON.stringify(cache));
				this.fakeState.flagsRes = res;
				return res;
			} catch (err) {
				console.log(err);
			}
	}
}

class UI {
	static fakeState: {
		covidCountry: string;
		from: number;
		to: number;
	} = {
		covidCountry: "",
		from: 0,
		to: 0,
	};

	static async getData() {
		await Promise.all(
			[
				dataHandler.getCovidData("https://covid-api.mmediagroup.fr/v1/cases"),
				dataHandler.getFlagData("https://restcountries.eu/rest/v2/all")
			]).then(() => UI.syncData()).catch(err => console.log(err));
	}

	static genUi() {
		dataHandler.fakeState.syncedRes.forEach((country) => {
			document
				.getElementById("app")
				?.querySelector(".container")
				?.appendChild(
					new CardElement(
						country.flag,
						country.country,
						country.deaths,
						country.recovered,
						country.confirmed
					)
				);
		});
	}

	static syncData() {
		for (const key in dataHandler.fakeState.covidRes) {
			const current = dataHandler.fakeState.covidRes[key].All.country;

			if (current === undefined) {
				const {
						country = 'Unknown',
						deaths,
						confirmed,
						recovered,
				} = dataHandler.fakeState.covidRes[key].All;

			const data = {
						flag:'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.explicit.bing.net%2Fth%3Fid%3DOIP.0uIGP5HI_xsXyBrJGwrpSQHaEK%26pid%3DApi&f=1',
						country,
						deaths,
						confirmed,
						recovered,
					};
				dataHandler.fakeState.syncedRes.push(data);
			} else if (dataHandler.fakeState.flagsRes.find((element: any) => element.name.toLowerCase() === current.toLowerCase())) {
				dataHandler.fakeState.flagsRes.find((element: any) => {
					if (element.name.toLowerCase() === current.toLowerCase()) {
						const {
						country,
						deaths,
						confirmed,
						recovered,
					} = dataHandler.fakeState.covidRes[key].All;

					const { flag } = element;

					const data = {
						flag,
						country,
						deaths,
						confirmed,
						recovered,
					};
						dataHandler.fakeState.syncedRes.push(data);
					};
				});
			} else {
				const {
						country,
						deaths,
						confirmed,
						recovered,
				} = dataHandler.fakeState.covidRes[key].All;
				
					const data = {
						flag:'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.explicit.bing.net%2Fth%3Fid%3DOIP.0uIGP5HI_xsXyBrJGwrpSQHaEK%26pid%3DApi&f=1',
						country,
						deaths,
						confirmed,
						recovered,
					};
				
				dataHandler.fakeState.syncedRes.push(data);
			}	
		}
		this.genUi();
	}

	static updateUI(from?:any, to?:any) {
		const covidGrid = document.querySelectorAll("card-element");

		this.fakeState.from = Number(parseInt(from).toFixed());
		this.fakeState.to = Number(parseInt(to).toFixed());

		covidGrid.forEach((element) => {
			if (
				!element.country
					.toLowerCase()
					.includes(this.fakeState.covidCountry.toLowerCase()) ||
				element.confirmed < this.fakeState.from ||
				element.confirmed > this.fakeState.to
			) {
				element.style.display = "none";
			} else {
				element.style.display = "block";
			}
		});
	}
}

class MyHeader extends LitElement {
	constructor() {
		super();
	}

	static get properties() {
		return {
			name: { type: String },
		};
	}

	static get styles() {
		return css`
			div {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-family: Inter, sans-serif;
			}

			div h1 {
				font-size: 2.5rem;
			}
		`;
	}

	render() {
		return html`
			<div>
				<h1>Covid Tracker</h1>
			</div>
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		UI.getData();
	}
}
customElements.define("my-header", MyHeader);

class CardElement extends LitElement {
	flag: String;
	country: String;
	deaths: number;
	recovered: number;
	confirmed: number;

	constructor(
		flag: string,
		country: string,
		deaths: number,
		recovered: number,
		confirmed: number
	) {
		super();
		this.flag = flag;
		this.country = country;
		this.deaths = deaths;
		this.recovered = recovered;
		this.confirmed = confirmed;
	}

	static get styles() {
		return css`
			div {
				box-sizing: border-box;
				max-width: 200px;
			}

			div img {
				display: block;
				width: 100%;
				object-fit: cover;
			}

			.details {
				background-color: #140f1a;
				color: #fff;
				font-family: Inter, sans-serif;
				width: 100%;
				padding: 1em;
			}
		`;
	}

	render() {
		return html`
			<div>
				<img src="${this.flag}" alt="flag" />
				<div class="details">
					<h3>Country: ${this.country}</h3>
					<p>Deaths: ${this.deaths}</p>
					<p>recovered: ${this.recovered}</p>
					<p>confirmed: ${this.confirmed}</p>
				</div>
			</div>
		`;
	}
}
customElements.define("card-element", CardElement);

class SliderElement extends LitElement {
	from: number;
	to: number;

	constructor() {
		super();
		this.from = 0;
		this.to = 0;
	}

	@query("#slider") _slider;

	render() {
		return html`
			<div class="slider-container">
				<h3>Cases: ${this.from}</h3>
				<h3>Cases: ${this.to}</h3>
				<div id="slider" @click="${() => this.readSlide()}"></div>
			</div>
		`;
	}

	createRenderRoot() {
		return this;
	}

	connectedCallback() {
		super.connectedCallback();
		setTimeout(() => {
			
			this.requestUpdate();
		}, 3000);
	}

	async firstUpdated() {
		await new Promise(r => setTimeout(r, 1000));
		const highestCountry = Object.entries(
			dataHandler.fakeState.covidRes
		).sort((a, b) => b[1].All.confirmed - a[1].All.confirmed);

		this.to = Number(highestCountry[1][1].All.confirmed));

		UI.fakeState.to = Number(highestCountry[1][1].All.confirmed));

		noUiSlider.create(this._slider, {
			start: [0, highestCountry[1][1].All.confirmed],
			connect: true,
			range: {
				min: 0,
				max: highestCountry[1][1].All.confirmed,
			},
		});

		this.querySelectorAll(".noUi-handle").forEach((element) => {
			element.addEventListener("pointerdown", () => this.readSlide());
			element.addEventListener("pointerup", () => this.readSlide());
		});

	}

	readSlide() {
		const [from, to] = this._slider.noUiSlider.get();
		this.from = Number(parseInt(from).toFixed());
		this.to = Number(parseInt(to).toFixed());
		UI.updateUI(from, to);
		this.requestUpdate();
	}
}
customElements.define("slider-element", SliderElement);

class MySearchBar extends LitElement {
	constructor() {
		super();
	}

	static get styles() {
		return css`
			form h2 {
				color: #140f1a;
				font-family: Inter, sans-serif;
				font-size: 2rem;
			}

			form .form-control input[type="text"] {
				width: 80%;
				padding: 0.6em 1em;
				border: 2px solid #140f1a;
				border-radius: 1.5em;
				font-size: 1rem;
				font-family: Inter, sans-serif;
			}

			form .form-control input[type="text"]::placeholder {
				font-weight: 700;
			}

			form .form-control input[type="text"]:focus {
				outline: none;
			}

			form .form-control input[type="submit"] {
				width: 15%;
				min-width: 150px;
				white-space: no-wrap;
				padding: 0.6em 1em;
				border: 2px solid #140f1a;
				background-color: #140f1a;
				color: #fff;
				border-radius: 1.5em;
				font-size: 1rem;
				font-family: Inter, sans-serif;
			}
		`;
	}

	render() {
		return html`
			<form>
				<h2>Search Countrys</h2>
				<div class="form-control">
					<input
						type="text"
						name="country"
						placeholder="Search for a Country"
						@keyup="${(e: any) => {
							UI.fakeState.covidCountry = e.target.value;
							UI.updateUI(e);
						}} "
					/>
					<input type="submit" value="Search" />
				</div>
			</form>
		`;
	}
}
customElements.define("my-search", MySearchBar);

