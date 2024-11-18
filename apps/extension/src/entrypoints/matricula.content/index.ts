import { storage } from "wxt/storage";
import { scrapeMenu } from "@/scripts/sig/homepage";
import { errorToast, processingToast, successToast } from "@/utils/toasts";
import "toastify-js/src/toastify.css";
import '@/assets/tailwind.css'


export default defineContentScript({
  main() {
    errorToast.showToast()
    processingToast.showToast()
    successToast.showToast()
    console.log('joabe')
  },
  runAt: "document_end",
	matches: ["https://ufabc-matricula-snapshot.vercel.app/*"],
})
