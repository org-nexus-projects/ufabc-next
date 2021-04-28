import Axios from "axios";

class Graduations {
  constructor() {}

  async getHistory(params) {
    return await Axios.get("/historiesGraduations", {
      params,
    });
  }

  async list(params) {
    return await Axios.get("/graduation", {
      params,
    });
  }

  async fetchSubjectGraduations(params) {
    return await Axios.get("/subjectGraduations", {
      params,
    });
  }
}

export default new Graduations();
