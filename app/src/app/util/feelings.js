import Translator from "./translator.js";

export default [
    {
        "value": "3",
        "name": "good",
        "text": Translator.get('entry.questions.feeling_very_good'),
        "icon": "sentiment_very_satisfied_alt"
    },
    {
        "value": "2",
        "name": "ok",
        "text": Translator.get('entry.questions.feeling_not_so_good'),
        "icon": "sentiment_dissatisfied_alt"
    },
    {
        "value": "1",
        "name": "bad",
        "text": Translator.get('entry.questions.feeling_sick'),
        "icon": "sentiment_very_dissatisfied_alt"
    }
];
