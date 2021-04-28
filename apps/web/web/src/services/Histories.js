import Axios from "axios";
import Vue from "vue";

class Histories {
  constructor() {}

  async getCourses(body) {
    return await Axios.get("/histories/courses/", { body });
  }

  async getHistoriesGraduations(body) {
    return await Axios.get("/histories/courses/", { body });
  }
}

export default new Histories();
