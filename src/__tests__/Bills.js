/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
///////////////////Mes imports/////////////////////
import Bills from "../containers/Bills.js";
import store from "../app/Store.js";
import mockStore from "../__mocks__/store";
import userEvent from "@testing-library/user-event";

//jest.mock("../app/Store", () => mockStore);

import router from "../app/Router.js";
import usersTest from "../constants/usersTest.js";

describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
		test("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			);
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");
			//to-do write expect expression
			expect(windowIcon.classList.contains("active-icon")).toBe(true); //doit etre true pour higlight l'icon depuis layout.css
		});
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const dates = screen
				.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => a - b;
			//const antiChrono = (a, b) => ((a < b) ? 1 : -1)
			// modification fonctionComparaison de la method sort() pour le tri
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
	});
	////////////////My Unite tests/////////////////

	//////////Test note de frais s'ouvre/////////////
	describe("when I click on the New Bill button", () => {
		test("Then it should open new bill page", () => {
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			const onNavigate = (pathname) => {
				window.onNavigate(pathname);
			};
			const billsInit = new Bills({ document, onNavigate, store, localStorage });
			billsInit.handleClickNewBill = jest.fn();
			const btnNewBill = screen.getByTestId("btn-new-bill"); //le bouton
			btnNewBill.addEventListener("click", billsInit.handleClickNewBill);
			btnNewBill.click();
			const formBill = screen.getByTestId("form-new-bill");
			expect(billsInit.handleClickNewBill).toHaveBeenCalled();
			expect(formBill).toBeTruthy();
		});
	});
	// TEST INTEGRATION GET
	describe("Given I am connected as an employee", () => {
		describe("When I am on Bills Page", () => {
			test("fetches bills from mock API GET", async () => {
				localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
				const root = document.createElement("div");
				root.setAttribute("id", "root");
				document.body.append(root);
				router();
				window.onNavigate(ROUTES_PATH.Bills);

				mockStore.bills = jest.fn();
				mockStore.bills(() => {
					mockedBills.list();
				});

				expect();
				expect(await waitFor(() => screen.getByText("Mes notes de frais"))).toBeTruthy();
			});
		});

		test("there is an iconeye button displayed", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			expect(screen.getAllByTestId("icon-eye")).toBeDefined();
		});
		describe("when i click on the button iconEye", () => {
			test("Then modal should open ", () => {
				Object.defineProperty(window, "localStorage", {
					value: localStorageMock,
				});
				window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

				const html = BillsUI({ data: bills });
				document.body.innerHTML = html;

				const billsContainer = new Bills({
					document,
					onNavigate,
					store: mockStore,
					localStorage: window.localStorage,
				});

				$.fn.modal = jest.fn();

				console.log($.fn.modal);

				const handleShowModalFile = jest.fn((e) => {
					billsContainer.handleClickIconEye(e.target);
				});
				const iconEye = screen.getAllByTestId("icon-eye")[0];
				iconEye.addEventListener("click", handleShowModalFile);
				userEvent.click(iconEye);

				expect(handleShowModalFile).toHaveBeenCalled();
				expect(screen.getAllByText("Justificatif")).toBeTruthy();
			});
		});
	});
});

describe("when an error occurs in API", () => {
	const root = document.createElement("div");
	root.setAttribute("id", "root");
	document.body.appendChild(root);
	router();

	test("fetches bills from an API and fails with 404 message error", async () => {
		mockStore.bills = jest.fn();
		mockStore.bills(() => {
			return Promise.reject(new Error("Erreur 404"));
		});
		const html = BillsUI({ error: "Erreur 404" });
		document.body.innerHTML = html;
		window.onNavigate(ROUTES_PATH.Bills);
		const message = screen.getByText("Erreur 404");
		expect(message).toBeTruthy();
	});

	test("fetches messages from an API and fails with 500 message error", async () => {
		mockStore.bills.mockImplementationOnce(() => {
			return {
				list: () => {
					return Promise.reject(new Error("Erreur 500"));
				},
			};
		});
		const html = BillsUI({ error: "Erreur 500" });
		document.body.innerHTML = html;
		window.onNavigate(ROUTES_PATH.Bills);
		await new Promise(process.nextTick);
		const message = screen.getByText("Erreur 500");
		expect(message).toBeTruthy();
	});
	test("fetches messages from an API test", async () => {
		mockStore.bills = jest.fn().mockImplementation(() => {
			return {
				list: jest.fn().mockResolvedValueOnce([""]),
			};
		});

		const billsInit = new Bills({ document, onNavigate, store: mockStore, localStorage });

		const resultat = await billsInit.getBills();

		expect(resultat.length).toBe(1);
	});
});
