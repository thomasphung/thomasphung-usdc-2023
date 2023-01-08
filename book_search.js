"use strict";
/** 
 * RECOMMENDATION
 * 
 * To test your code, you should open "tester.html" in a web browser.
 * You can then use the "Developer Tools" to see the JavaScript console.
 * There, you will see the results unit test execution. You are welcome
 * to run the code any way you like, but this is similar to how we will
 * run your code submission.
 * 
 * The Developer Tools in Chrome are available under the "..." menu, 
 * futher hidden under the option "More Tools." In Firefox, they are 
 * under the hamburger (three horizontal lines), also hidden under "More Tools." 
 */

/**
 * Nullability check of a value.
 * @param {*} value - Any value to be null-checked
 * @returns {boolean} - True if value is null or undefined; false otherwise
 */
function isNull(value) {
    return value == null;
}

/**
 * Validates a JSON object to ensure it matches the definition of a JSON book object about scanned text.
 * @param {JSON} scannedTextObj - A JSON object representing the scanned text
 * @returns {boolean} - True if scannedTextObj represents a valid JSON object on scanned text; false otherwise
 */
function validateBookObj(scannedTextObj) {
    let requiredBookKeys = {
        "Title": "string",
        "ISBN": "string",
        "Content": "object"
    };

    for (const [key, type] of Object.entries(requiredBookKeys)) {
        let value = scannedTextObj[key];
        if (isNull(value) || typeof(value) !== type) {
            throw new Error(`${key} cannot contain a null value or has a value that isn't "${type}" type`)
        }
    }
    
    let requiredContentKeys = {
        "Page": "number",
        "Line": "number",
        "Text": "string"
    };

    let contentValue = scannedTextObj["Content"];
    for (const lineObj in contentValue) {
        for (const [key, type] of Object.entries(requiredContentKeys)) {    
            if (isNull(lineObj[key]) || typeof(lineObj[key]) !== type) {
                throw new Error(`${JSON.stringify(lineObj)}: 
                        ${key} cannot contain a null value or has a value that isn't "${type}" type`)
            }
        }
    }

    return true;
}

/**
 * Book class, represents a book with a registered ISBN that had zero or more of its pages scanned.
 * Assume book is written in the English language.
 */
class Book {
    // Private fields
    #title;
    #isbn;
    /**
     * 2D array, an array of arrays of PageLineText objects 
     * First index represents page number and second index represents line number.
     * Okay if elements are not contiguous; iterate by Object.keys in ascending order.
     * 
     * Opting to store contents in objects (dictionary-like) instead of arrays since the latter will
     * allocate additional indexes in memory even if not in use to maintain contiguous nature of arrays.
     * This may be an issue for iterating since scanned pages may follow an arbitrary order.
     * We can have a book that only has page 1 and page 2000 scanned, requiring iteration over 1999 empty indexes.
     */
    #contentArr = {};

    /**
     * Constructs a new Book object.
     * @param {string} title - book's title
     * @param {string} isbn - book's ISBN
     * @param {object} contentArr - array of scanned lines from book
     */
    constructor(title, isbn, contentArr) {
        if (isNull(title) || typeof(title) !== "string") {
            throw new Error("title cannot contain a null value or has a value that isn't of \"string\" type");
        }
        if (isNull(isbn) || typeof(isbn) !== "string") {
            throw new Error("isbn cannot contain a null value or has a value that isn't of \"string\" type");
        }
        if (isNull(contentArr) || typeof(contentArr) !== "object") {
            throw new Error("contentArr cannot contain a null value or has a value that isn't of \"object\" type");
        }

        if (title === "") {
            throw new Error("title cannot be an empty string");
        }
        this.#title = title;

        if (!Book.validateISBN(isbn)) {
            throw new Error("Invalid ISBN value; must be a 10 or 13 digit string with no delimiters");
        }
        this.#isbn = isbn;

        // Cannot assume Content entries are ordered in accordance to page number and line number
        // I.e. table index may not represent ascending order of lines
        for (const contentJSON of contentArr) {
            // Construct new PageLineText object to validate data in book Content
            const pageLineTextObj = new PageLineText(contentJSON["Page"], contentJSON["Line"], contentJSON["Text"]);
            let pageNum = pageLineTextObj.page;
            let lineNum = pageLineTextObj.line;

            // First time we see page number in book data
            if (isNull(this.#contentArr[pageNum])) {
                this.#contentArr[pageNum] = {};
            }

            // We want page and line number combination to be unique identifier to a particular line of text.
            // If there is another text entry with the same page and line number, then there is probably an 
            // issue upstream with how data is processed.
            // Don't want to assume behavior like overriding existing entry with newer one so error throwing
            // is a safer solution.
            if (!isNull(this.#contentArr[pageNum][lineNum])) {
                throw new Error(`Duplicate text entry on page #${pageNum}, line #${lineNum}`);
            }

            this.#contentArr[pageNum][lineNum] = pageLineTextObj;
        }
    }

    /**
     * Validates ISBN based on official ISBN spec.
     * @param {string} isbn - ISBN
     * @returns {boolean} - True if isbn is a valid ISBN with 10 or 13 digits and no delimiters; false otherwise
     */
    static validateISBN(isbn) {
        const regex = new RegExp(/^\d{10}(\d{3})?$/);
        return regex.test(isbn);
    }

    /**
     * Getter for title attribute.
     * @returns {string} - Book title
     */
    get title() {
        return this.#title;
    }

    /**
     * Getter for ISBN attribute.
     * @returns {string} - Book ISBN
     */
    get isbn() {
        return this.#isbn;
    }

    /**
     * Getter for content attribute.
     * @returns {object} - Array of PageLine objects
     */
    get content() {
        return this.#contentArr;
    }

    /**
     * Performs a search of a term in the book's scanned text.
     * @param {string} searchTerm - Term to be searched in book text, case-sensitive
     * @returns {object} - Array of successful matches
     */
    searchForTerm(searchTerm) {
        let resultArr = [];

        // Cannot assume Object.keys are ordered in ascending alphanumerical order.
        // Though in modern ECMAScript specification, all non-negative integer keys are
        // traversed first in ascending order by value while other string keys are iterated 
        // by order of creation.
        // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...
        function comparator(a, b) {
            // Assume a and b are strings
            return a.charCodeAt(0) - b.charCodeAt(0);
        }

        let pageNumArr = Object.keys(this.#contentArr);
        pageNumArr = pageNumArr.sort(comparator);

        for (const pageNum of pageNumArr) {
            let lineNumArr = Object.keys(this.#contentArr[pageNum]);
            lineNumArr = lineNumArr.sort(comparator);

            for (const lineNum of lineNumArr) {
                let lineText = this.#contentArr[pageNum][lineNum].text;
                
                if (lineText.includes(searchTerm)) {
                    resultArr.push(new SearchResult(Number.parseInt(pageNum), Number.parseInt(lineNum), this.#isbn));
                } else if (lineText.endsWith("-") &&
                        this.#searchForLineBreakedTerm(searchTerm, lineText, this.#contentArr[pageNum][lineNum + 1])) {
                    /**
                     * If there is a word that wraps to the next line (i.e. is hyphen-breaked),
                     * perform a look ahead check.
                     * 
                     * If the word wraps to the first line of the next page, then
                     * currently there is no way to confirm if this is the case with current knowledge
                     * (e.g. we don't know the max number of lines on a page, there is no data that
                     * maps to this or we can derive from)
                     */
                    resultArr.push(new SearchResult(Number.parseInt(pageNum), Number.parseInt(lineNum + 1), this.#isbn));
                }
            }
        }
        return resultArr;
    }

    /**
     * Helper method to find a search term that is line-breaked across two lines with a hyphen.
     * @param {string} searchTerm - Term to be searched in book text, case-sensitive
     * @param {string} currentLineText - Current line text
     * @param {string} subsequentLineText - Line text following the current
     * @returns {boolean} - True if search term does span across two lines; false otherwise
     */
    #searchForLineBreakedTerm(searchTerm, currentLineText, subsequentLineText) {
        // It is possible that subsequent line is not scanned (undefined)
        if (isNull(subsequentLineText)) {
            return false;
        }

        let lineEnd = currentLineText.split(" ").pop().replace("-$", "");
        
        if (searchTerm.startsWith(lineEnd)) {
            let subsequentLineStart = subsequentLineText.split(" ").shift();

            if (searchTerm.endsWith(subsequentLineStart)) {
                return true;
            }
        }
        return false;
    }
}

/**
 * PageLine class, represents a line of text on a page of a book.
 * 
 * Should be treated as an abstract class that cannot not be instantiated by itself.
 * Use SearchResult or PageLineText subclasses instead.
 * 
 * @abstract
 */
class PageLine {
    #pageNum;
    #lineNum;

    /**
     * Constructs a new PageLine object.
     * @param {number} pageNum - Page number
     * @param {number} lineNum - Line number
     */
    constructor(pageNum, lineNum) {
        if (this.constructor === PageLine) {
            throw new Error("Abstract classes cannot be instantiated.");
        }
        if (!PageLine.#validatePageOrLineNum(pageNum)) {
            throw new Error("Page number must be a non-zero, positive integer");
        }
        if (!PageLine.#validatePageOrLineNum(lineNum)) {
            throw new Error("Line number must be a non-zero, positive integer");
        }

        this.#pageNum = pageNum;
        this.#lineNum = lineNum;
    }

    /**
     * Validates page or line number.
     * @param {number} pageOrLineNum - Page or line number
     * @returns {boolean} - True if pageNum is a non-zero, positive integer; false otherwise.
     * @static
     */
    static #validatePageOrLineNum(pageOrLineNum) {
        return pageOrLineNum > 0 && (pageOrLineNum % 1 === 0);
    }

    /**
     * Getter for page number attribute.
     * @returns {number} - Page number
     */
    get page() {
        return this.#pageNum;
    }

    /**
     * Getter for line number attribute.
     * @return {number} - Line number
     */
    get line() {
        return this.#lineNum;
    }
}

/**
 * SearchResult class represents a successful match of a search term within a line on a book's page.
 */
class SearchResult extends PageLine {
    #isbn;

    /**
     * Constructs a new SearchResult object.
     * @param {number} pageNum - Page number
     * @param {number} lineNum - Line number
     * @param {string} isbn - ISBN
     */
    constructor(pageNum, lineNum, isbn) {
        super(pageNum, lineNum);

        if (!Book.validateISBN(isbn)) {
            throw new Error("Invalid ISBN value; must be a 10 or 13 digit string with no delimiters");
        }

        this.#isbn = isbn;
    }

    /**
     * Getter for ISBN attribute.
     * @return {string} - ISBN value
     */
    get isbn() {
        return this.#isbn;
    }
}

/**
 * PageLineText class represents a single line of text on a book's page.
 */
class PageLineText extends PageLine {
    #text;

    /**
     * Constructs a new PageLineText object.
     * @param {number} pageNum - Page number
     * @param {number} lineNum - Line number
     * @param {string} text - Line text
     */
    constructor(pageNum, lineNum, text) {
        super(pageNum, lineNum);
        // Note that it is possible for a line to be empty (e.g. just whitespace for formatting)
        this.#text = text.trim();
    }

    /**
     * Getter for line text attribute.
     * @return {string} - Line text
     */
    get text() {
        return this.#text;
    }
}

/**
 * Searches for matches in scanned text.
 * @param {string} searchTerm - The word or term we're searching for. 
 * @param {JSON} scannedTextObj - A JSON object representing the scanned text. Will not be modified.
 * @returns {JSON} - Search results.
 */
 function findSearchTermInBooks(searchTerm, scannedTextObj) {
    if (isNull(searchTerm) || typeof(searchTerm) !== "string") {
        throw new Error("searchTerm must be a \"string\" type and not a null value");
    }

    if (searchTerm === "") {
        throw new Error("searchTerm must be a non-empty string");
    }

    if (!isNull(searchTerm.match(/[\u0000-\u001F\u007F-\u009F]/g))) {
        throw new Error("searchTerm cannot have control characters");
    }

    if (isNull(scannedTextObj) || typeof(scannedTextObj) !== "object") {
        throw new Error("scannedTextObj must be an \"object\" type and not a null value");
    }

    let resultJSON = {
        "SearchTerm": searchTerm,
        "Results": []
    };

    for (const bookJSON of scannedTextObj) {
        const bookObj = new Book(bookJSON["Title"], bookJSON["ISBN"], bookJSON["Content"]);
        resultJSON.Results.concat(bookObj.searchForTerm(searchTerm));
    }

    return resultJSON;
}

/** Example input object. */
const twentyLeaguesIn = [
    {
        "Title": "Twenty Thousand Leagues Under the Sea",
        "ISBN": "9780000528531",
        "Content": [
            {
                "Page": 31,
                "Line": 8,
                "Text": "now simply went on by her own momentum.  The dark-"
            },
            {
                "Page": 31,
                "Line": 9,
                "Text": "ness was then profound; and however good the Canadian\'s"
            },
            {
                "Page": 31,
                "Line": 10,
                "Text": "eyes were, I asked myself how he had managed to see, and"
            } 
        ] 
    }
]
    
/** Example output object */
const twentyLeaguesOut = {
    "SearchTerm": "the",
    "Results": [
        {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
        }
    ]
}

/*
 _   _ _   _ ___ _____   _____ _____ ____ _____ ____  
| | | | \ | |_ _|_   _| |_   _| ____/ ___|_   _/ ___| 
| | | |  \| || |  | |     | | |  _| \___ \ | | \___ \ 
| |_| | |\  || |  | |     | | | |___ ___) || |  ___) |
 \___/|_| \_|___| |_|     |_| |_____|____/ |_| |____/ 
                                                      
 */

/* We have provided two unit tests. They're really just `if` statements that 
 * output to the console. We've provided two tests as examples, and 
 * they should pass with a correct implementation of `findSearchTermInBooks`. 
 * 
 * Please add your unit tests below.
 * */

/** We can check that, given a known input, we get a known output. */
const test1result = findSearchTermInBooks("the", twentyLeaguesIn);
if (JSON.stringify(twentyLeaguesOut) === JSON.stringify(test1result)) {
    console.log("PASS: Test 1");
} else {
    console.log("FAIL: Test 1");
    console.log("Expected:", twentyLeaguesOut);
    console.log("Received:", test1result);
}

/** We could choose to check that we get the right number of results. */
const test2result = findSearchTermInBooks("the", twentyLeaguesIn); 
if (test2result.Results.length == 1) {
    console.log("PASS: Test 2");
} else {
    console.log("FAIL: Test 2");
    console.log("Expected:", twentyLeaguesOut.Results.length);
    console.log("Received:", test2result.Results.length);
}

// Tests for Book class
const bookConstructorTest = new Book(twentyLeaguesIn["Title"], twentyLeaguesIn["ISBN"], twentyLeaguesIn["Content"]);

// Tests for PageLine class
const pageLineConstructorTest = new PageLine(31, 8);

// Tests for PageLineText class
const pageLineTextConstructorTest = new PageLineText(31, 8, "Example text");

// Tests for SearchResult class
const searchResultConstructorTest = new SearchResult(31, 8, "9780000528531");

// Tests for findSearchTermInBooks()

