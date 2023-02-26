const RANDOM_WORD_URL = 'https://words.dev-apis.com/word-of-the-day?random=1';
const VALIDATION_URL = 'https://words.dev-apis.com/validate-word';

const ROW_COUNT = 6;
const COL_COUNT = 5;

const loadingIndicator = document.querySelector('.loading-indicator');
const letterBoxes = document.querySelectorAll('.letter-box');  
let gameEnded = false;
let theWord = "";
let boxIndex = 0;

const setLoadingStatus = (isLoading) => {
    loadingIndicator.classList.toggle('hidden', !isLoading);
}

const invalidateBoxes = (start, end) => {
    for (let i = start; i < end; i++) {
        const letterBox = letterBoxes[i];
        if (letterBox.classList.contains('invalid')) {
            letterBox.classList.remove('invalid');
            letterBox.offsetWidth;
        }
        letterBox.classList.add('invalid')
    }
}

const addClassesToBoxes = (start, end, classes) => {
    let classIdx = 0;
    for (let i = start; i < end; i++) {
        letterBoxes[i].classList.add(classes[classIdx]);
        classIdx++;
    }
}

const isSingleLetter = text => {
    return /^[a-zA-Z]$/.test(text);
}

const addLetterToCurrentBox = letter => {
    letterBoxes[boxIndex].innerHTML = letter;
    if (boxIndex % COL_COUNT < COL_COUNT - 1) {
        boxIndex += 1;
    }
}

const removeCurrentBoxLetter = () => {
    let letterBox = letterBoxes[boxIndex];

    const col = boxIndex % COL_COUNT;
    if (col > 0 && letterBox.innerHTML === '') {
         boxIndex -= 1;
    }

    letterBox = letterBoxes[boxIndex];
    letterBox.innerHTML = '';
}

const fetchWord = async () => {
    setLoadingStatus(true);
    const resp = await fetch(RANDOM_WORD_URL);
    const respObj = await resp.json();
    setLoadingStatus(false);

    return respObj.word;
};

const validateWord = async word => {
    setLoadingStatus(true);
    const resp = await fetch(
        VALIDATION_URL,
        {
            method: 'POST',
            body: JSON.stringify({"word": word})
        });

    if (resp.status !== 200) {
        return false;
    }

    const respObj = await resp.json();
    setLoadingStatus(false);

    return respObj.validWord;
}

const submitWord = async idx => {
    if (idx % COL_COUNT < COL_COUNT - 1) {
        return;
    }

    const letterBox = letterBoxes[idx];
    if (letterBox.innerHTML === '') {
        return;
    }
    const start = idx - COL_COUNT + 1;
    const end = idx + 1;
    console.log(start, end);
    const word = getWordFromBoxes(start, end);
    console.log(word);
    const isValid = await validateWord(word);
    if (!isValid) {
        invalidateBoxes(start, end);
        return;
    } 
    const letterClasses = getCorrectnessClasses(word);
    addClassesToBoxes(start, end, letterClasses);
    tryEndGame(word, idx);
    boxIndex += 1;
};

const tryEndGame = (word, idx) => {
    const row = Math.trunc(idx / COL_COUNT);
    const col = idx % COL_COUNT;
    const start = idx - COL_COUNT + 1;
    const end = idx + 1;
    if (word === theWord) {
        gameEnded = true;
        alert('Congrats, you\'ve won the game.');
        addClassesToBoxes(start, end, Array(COL_COUNT).fill('win'));
    } else if (row === ROW_COUNT - 1 && col === COL_COUNT - 1) {
        gameEnded = true;
        alert(`You've lost the game. The word was: ${theWord}`);
    }
};

const getCorrectnessClasses = word => {
    const letterMap = createLetterMap(theWord);
    console.log(letterMap);
    const classes = Array(word.length);
    for (let i = 0; i < word.length; i++) {
        if (theWord[i] == word[i]) {
            classes[i] = 'exists-correct-pos';
            letterMap[word[i]] -= 1;
        }
    }
    for (let i = 0; i < word.length; i++) {
        if (classes[i] === 'exists-correct-pos') {
            continue;
        }
        console.log(word[i], letterMap.hasOwnProperty(word[i]));
        if (letterMap.hasOwnProperty(word[i]) && letterMap[word[i]] > 0) {
            console.log(word[i], letterMap[word[i]]);
            classes[i] = 'exists-wrong-pos';
            letterMap[word[i]] -= 1;
        } else {
            classes[i] = 'does-not-exist';
        }
    }
    return classes;
};

const getWordFromBoxes = (start, end) => {
    let word = "";
    for (let i = start; i < end; i++) {
        word += letterBoxes[i].innerHTML;
    }

    return word;
}

const createLetterMap = word => {
    let letterMap = {}
    for (let i = 0; i < word.length; i++) {
        if (!letterMap.hasOwnProperty(word[i])) {
            letterMap[word[i]] = 0;
        }
        letterMap[word[i]] += 1;
    }
    return letterMap;
}

(async () => {
    theWord = await fetchWord();
    document.addEventListener('keydown', ev => {
        if (gameEnded) {
            return;
        }
        if (isSingleLetter(ev.key)) {
            addLetterToCurrentBox(ev.key);
        } else if (ev.key === 'Backspace') {
            removeCurrentBoxLetter();
        } else if (ev.key === 'Enter') {
            submitWord(boxIndex);
        }
    });
})();
