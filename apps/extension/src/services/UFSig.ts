import { useFetch } from "@vueuse/core";
import { FetchError, ofetch } from "ofetch";
import { storage } from 'wxt/storage'

type NTIStudent = {
	firstname: string;
	fullname: string;
	lastname: string;
	username: string;
	email: string[];
};

const CACHE_KEY = "NTI_STUDENT";
const MENU_GRADES_ACTION_ID = "82316"

export async function fetchGrades() {
	const sigURL = "/sigaa/portais/discente/discente.jsf";
	const formData = new FormData();

	formData.append("menu:form_menu_discente", "menu:form_menu_discente");
	formData.append("id", MENU_GRADES_ACTION_ID);
	formData.append(
		"jscook_action",
		"menu_form_menu_discente_j_id_jsp_340461267_98_menu:A]#{ relatorioNotasAluno.gerarRelatorio }",
	);
	formData.append(
		"javax.faces.ViewState",
		document.querySelector<HTMLInputElement>(
			'input[name="javax.faces.ViewState"]',
		)?.value || "",
	);

	try {
		const response = await fetch(sigURL, {
			method: "POST",
			credentials: "include",
			body: formData,
		});
		const grades = await response.text();
		return { data: grades, error: null };
	} catch (error) {
		console.log("deu merda mestre", error);
		return {
			data: null,
			error,
		};
	}
}

export async function getUFStudent(ra: string) {
	const cachedNTIStudent = await storage.getItem<NTIStudent>(
		`session:${CACHE_KEY}`,
	);

	if (cachedNTIStudent) {
		return cachedNTIStudent;
	}

  try {
    const student = await ofetch<NTIStudent>(`${import.meta.env.VITE_UFABC_SIG_NTI_URL}?funcao=2&valor=${ra}`);
    await storage.setItem(`session:${CACHE_KEY}`, student)
    return student
  } catch(error) {
    // ADD TOASTS
    if(error instanceof FetchError) {
      console.log({
        msg: "A problem has ocurred when fetching, please try again",
        error: error.message,
      })
      throw error;
    }
    throw error
  }
}
