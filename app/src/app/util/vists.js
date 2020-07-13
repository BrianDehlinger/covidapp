import Translator from "./translator.js";

const getVisitsForSubmission = (sub) => {
    const vists = [
        {
            translation: 'bar',
            visited: sub.visited_bar,
        },
        {
            translation: 'restaurant',
            visited: sub.visited_restaurant,
        },
        {
            translation: 'concert',
            visited: sub.visited_concert,
        },
        {
            translation: 'nightclub',
            visited: sub.visited_nightclub,
        },
        {
            translation: 'church',
            visited: sub.visited_church,
        },
        {
            translation: 'large gathering',
            visited: sub.visited_gathering,
       }
    ];
    return vists.filter(visit => visit.visited);
}

export default getVisitsForSubmission;
