import Translator from "./translator.js";

const getSymptomsForSubmission = (sub) => {
    const symptoms = [
        {
            translation: Translator.get('entry.questions.cough'),
            hasSymptom: sub.symptom_cough,
        },
        {
            translation: Translator.get('entry.questions.difficulty_breathing'),
            hasSymptom: sub.symptom_difficulty_breathing,
        },
        {
            translation: Translator.get('entry.questions.fever'),
            hasSymptom: sub.symptom_fever,
        },
        {
            translation: Translator.get('entry.questions.headache'),
            hasSymptom: sub.symptom_headache,
        },
        {
            translation: Translator.get('entry.questions.chills'),
            hasSymptom: sub.symptom_chills,
        },
        {
            translation: Translator.get('entry.questions.sore_throat'),
            hasSymptom: sub.symptom_sore_throat,
        },
        {
            translation: Translator.get('entry.questions.shaking'),
            hasSymptom: sub.symptom_nausea,
        },
        {
            translation: Translator.get('entry.questions.loss_of_taste'),
            hasSymptom: sub.symptom_loss_of_taste,
        },
        {
            translation: Translator.get('entry.questions.muscular_pain'),
            hasSymptom: sub.symptom_muscle_pain,
        },
    ];
    return symptoms.filter(symp => symp.hasSymptom);
}

export default getSymptomsForSubmission;
