import Graduations from "@/services/Graduations";
import Auth from "@/services/Auth";
import _ from "lodash";

export default {
  name: "Planning",
  data() {
    return {
      graduations: [],
      selectedGraduation: null,
      subjects: [],
      history: null,
      loadingSubjects: false,
      loadingHistory: false,
      starterYear: null,
      starterQuad: null,
      mode: "ideal",
    };
  },

  watch: {
    async selectedGraduation() {
      this.fetchSubjects();
      this.fetchHistory();
    },
  },

  created() {
    this.fetchGraduations();
  },

  computed: {
    hasStudentHistory() {
      return true;
    },

    termsByYear() {
      const creditsBreakdown = _.get(
        this.selectedGraduation,
        "creditsBreakdown",
        null
      );

      if (!creditsBreakdown) return [];

      return _.groupBy(creditsBreakdown, "year");
    },

    disciplines() {
      return _.get(this.history, "disciplinas", []);
    },

    mandatoryCreditsTotal() {
      return _.get(this.selectedGraduation, "mandatory_credits_number", "?");
    },

    limitedCreditsTotal() {
      return _.get(this.selectedGraduation, "limited_credits_number", "?");
    },

    freeCreditsTotal() {
      return _.get(this.selectedGraduation, "free_credits_number", "?");
    },

    creditsTotal() {
      return _.get(this.selectedGraduation, "credits_total", "?");
    },

    mandatoryCreditsCompleted() {
      return (
        this.disciplines
          .filter((d) => d.categoria == "Obrigatória")
          .map((d) => d.creditos)
          .reduce((a, b) => a + b, 0) || "?"
      );
    },

    limitedCreditsCompleted() {
      return (
        this.disciplines
          .filter((d) => d.categoria == "Opção Limitada")
          .map((d) => d.creditos)
          .reduce((a, b) => a + b, 0) || "?"
      );
    },

    freeCreditsCompleted() {
      return (
        this.disciplines
          .filter((d) => d.categoria == "Livre Escolha")
          .map((d) => d.creditos)
          .reduce((a, b) => a + b, 0) || "?"
      );
    },

    totalCreditsCompleted() {
      let result = 0;
      if (this.mandatoryCreditsCompleted > 0) {
        result += Math.min(
          this.mandatoryCreditsCompleted,
          this.mandatoryCreditsTotal
        );
      }

      if (this.limitedCreditsCompleted > 0) {
        result += Math.min(
          this.limitedCreditsCompleted,
          this.limitedCreditsTotal
        );
      }

      if (this.freeCreditsCompleted > 0) {
        result += Math.min(this.freeCreditsCompleted, this.freeCreditsTotal);
      }
      return result || "?";
    },

    mandatoryCreditsPercentage() {
      const completed = Number(this.mandatoryCreditsCompleted) || 0;
      const total = Number(this.mandatoryCreditsTotal) || 0;
      return !_.isNaN(completed) && !_.isNaN(total) && total > 0
        ? ((completed / total) * 100).toFixed(0)
        : 0;
    },

    limitedCreditsPercentage() {
      const completed = Number(this.limitedCreditsCompleted) || 0;
      const total = Number(this.limitedCreditsTotal) || 0;
      return !_.isNaN(completed) && !_.isNaN(total) && total > 0
        ? ((completed / total) * 100).toFixed(0)
        : 0;
    },

    freeCreditsPercentage() {
      const completed = Number(this.freeCreditsCompleted) || 0;
      const total = Number(this.freeCreditsTotal) || 0;
      return !_.isNaN(completed) && !_.isNaN(total) && total > 0
        ? ((completed / total) * 100).toFixed(0)
        : 0;
    },

    totalCreditsPercentage() {
      const completed = Number(this.totalCreditsCompleted) || 0;
      const total = Number(this.creditsTotal) || 0;
      return !_.isNaN(completed) && !_.isNaN(total) && total > 0
        ? ((completed / total) * 100).toFixed(0)
        : 0;
    },
  },

  methods: {
    isCompleted(subjectName) {
      if (subjectName == "Livre Escolha") {
        return true;
      }
      return this.disciplines.find((d) => d.disciplina == subjectName);
    },

    sumAllCompletedCredits(subjects) {
      return (
        subjects
          .filter((s) => this.isCompleted(s.subject.name))
          .map((d) => d.creditos)
          .reduce((a, b) => a + b, 0) || "0"
      );
    },

    sumAllCredits(subjects) {
      return subjects.map((d) => d.creditos).reduce((a, b) => a + b, 0) || "?";
    },

    filterSubjects(quad, year) {
      return this.subjects.filter(
        (subject) => subject.quad == quad && subject.year == year
      );
    },

    async fetchGraduations() {
      try {
        const { data } = await Graduations.list({ limit: 200 });
        this.graduations = data.docs;
        if (data.docs && data.docs.length) {
          this.selectedGraduation = data.docs[0];
        }
      } catch (err) {
        console.log(err);
      }
    },

    async fetchSubjects() {
      try {
        this.loadingSubjects = true;
        const { data } = await Graduations.fetchSubjectGraduations({
          limit: 400,
          populate: ["subject"],
          graduation: this.selectedGraduation && this.selectedGraduation._id,
        });
        this.subjects = data.docs;
        this.populateSubjects();
      } catch (err) {
        console.log(err);
      } finally {
        this.loadingSubjects = false;
      }
    },

    async fetchHistory() {
      try {
        this.loadingHistory = true;
        const { data } = await Graduations.getHistory({
          graduation: this.selectedGraduation && this.selectedGraduation._id,
        });
        this.history = data.docs && data.docs[0];
        const coefficients = _.get(this.history, "coefficients", null);
        if (!coefficients) return;

        this.starterYear = Object.keys(coefficients).sort()[0];
        this.starterQuad = Object.keys(
          coefficients[this.starterYear]
        ).sort()[0];
      } catch (err) {
        console.log(err);
      } finally {
        this.loadingHistory = false;
      }
    },

    populateSubjects() {
      const creditsBreakdown = _.get(
        this.selectedGraduation,
        "creditsBreakdown",
        null
      );

      if (!creditsBreakdown) return;

      const hasChoosableCredits = creditsBreakdown.filter(
        (t) => t.choosableCredits
      );
      let limitedPopulated = 0;
      hasChoosableCredits.forEach((term) => {
        const qty = term.choosableCredits / 4;
        limitedPopulated += term.choosableCredits;

        Array(qty)
          .fill(0)
          .map((_, i) => {
            this.subjects.push({
              year: term.year,
              quad: term.quad,
              category:
                limitedPopulated > this.limitedCreditsTotal
                  ? "free"
                  : "limited",
              creditos: 4,
              _id: i,
              subject: {
                name:
                  limitedPopulated > this.limitedCreditsTotal
                    ? "Livre Escolha"
                    : "Opção Limitada",
              },
            });
          });
      });
      console.log("populateSubjects", hasChoosableCredits);
    },

    getCurrentYearQuad(quadNumber) {
      if (!this.starterYear || !this.starterQuad) {
        return "-";
      }
      const year = parseInt(this.starterYear);
      const quad = parseInt(this.starterQuad);
      const sum = quadNumber - 1;
      if (quad + sum <= 3) {
        return year + ":" + (quad + sum);
      }
      const yearsPassed = Math.floor((quad + (quadNumber - 2)) / 3);
      const diffQuad = Math.floor((quad + sum) % 3);
      return year + yearsPassed + ":" + (diffQuad == 0 ? "3" : diffQuad);
    },
  },
};
