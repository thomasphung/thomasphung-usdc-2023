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
 * Book class, represents a book with a registered ISBN that had 
 * zero or more of its pages scanned.
 * Assume book is written in the English language and grammar, 
 * written left-to-right and top-to-down.
 * A book can be defined as an object with 1 or more pages with each 
 * page containing 1 or more lines of text.
 * A line of text contains multiple words that are separated by a space or 
 * a punctuation mark and a space.
 * A line of text can be empty, signifying whitespace for formatting.
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
     * Opting to store contents in objects (dictionary-like) instead of arrays 
     * since the latter will allocate additional indexes in memory even if not in 
     * use to maintain contiguous nature of arrays. This may be an issue for 
     * iterating since scanned pages may follow an arbitrary order.
     * We can have a book that only has page 1 and page 2000 scanned, 
     * requiring iteration over 1999 empty indexes.
     */
    #contentArr = {};

    // Constant for storing punctuation marks so we can split for words in a line.
    // Note that em dash is included but not a hyphen.
    // #PUNCTUATION_MARKS = [ " ", ",", ".", "?", "!", ":", ";", "(", ")", "[", "]", "\"", "/", "—"];
    // #PUNCTUATION_REGEX = new RegExp("[" + this.#PUNCTUATION_MARKS.join("\\") + "?]");

    // Support for contractions, possessive nouns, and hyphenated words.
    // Including support for accented Latin characters because there are valid
    // spellings of English words that use diacritical marks like "résumé"
    #WORD_REGEX = new RegExp(/[A-Za-z'\-À-ÖØ-Ýà-öø-ÿ]+/g);

    /**
     * Constructs a new Book object.
     * @param {string} title - book's title
     * @param {string} isbn - book's ISBN
     * @param {object} contentArr - array of scanned lines from book
     */
    constructor(title, isbn, contentArr) {
        if (isNull(title) || typeof(title) !== "string") {
            throw new Error(
                    "title cannot contain a null value or has a value that isn't of \"string\" type");
        }
        if (isNull(isbn) || typeof(isbn) !== "string") {
            throw new Error(
                    "isbn cannot contain a null value or has a value that isn't of \"string\" type");
        }
        if (isNull(contentArr) || typeof(contentArr) !== "object") {
            throw new Error(
                    "contentArr cannot contain a null value or has a value that isn't of \"object\" type");
        }

        if (title === "") {
            throw new Error("title cannot be an empty string");
        }
        this.#title = title;

        if (!Book.validateISBN(isbn)) {
            throw new Error("Invalid ISBN value; must be a 10 or 13 digit string with no delimiters");
        }
        this.#isbn = isbn;

        // Cannot assume Content entries are ordered in accordance to page number and line number.
        // I.e. table index may not represent ascending order of lines.
        for (const contentJSON of contentArr) {
            // Construct new PageLineText object to validate data in book Content
            const pageLineTextObj = new PageLineText(
                    contentJSON["Page"], contentJSON["Line"], contentJSON["Text"]);
            let pageNum = pageLineTextObj.page;
            let lineNum = pageLineTextObj.line;

            // First time we see page number in book data
            if (isNull(this.#contentArr[pageNum])) {
                this.#contentArr[pageNum] = {};
            }

            // We want page and line number combination to be unique 
            // identifier to a particular line of text.
            // If there is another text entry with the same page and 
            // line number, then there is probably an 
            // issue upstream with how data is processed.
            // Don't want to assume behavior like overriding 
            // existing entry with newer one so error throwing is a safer solution.
            if (!isNull(this.#contentArr[pageNum][lineNum])) {
                throw new Error(`Duplicate text entry on page #${pageNum}, line #${lineNum}`);
            }

            this.#contentArr[pageNum][lineNum] = pageLineTextObj;
        }
    }

    /**
     * Validates computer-readable ISBN based on official ISBN spec.
     * Static function since its purpose is independent 
     * of Book object but is within scope of books.
     * (i.e. don't need to instantiate a book object to validate ISBN values)
     * @param {string} isbn - ISBN
     * @returns {boolean} - True if isbn is a valid ISBN with 10 or 13 digits 
     * and no delimiters; false otherwise
     */
    static validateISBN(isbn) {
        if (typeof(isbn) !== "string") {
            throw new Error("isbn must be of \"string\" type");
        }
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
                this.#addSearchResult(this.#contentArr[pageNum][lineNum], searchTerm, resultArr);
            }
        }
        return resultArr;
    }

    /**
     * Adds any search term matches to result array.
     * @param {PageLineText} pageLineTextObj - Current PageLineText object
     * @param {string} searchTerm - Search term
     * @param {object} resultArr - Result array, is modified if a match is found
     */
    #addSearchResult(pageLineTextObj, searchTerm, resultArr) {
        let lineText = pageLineTextObj.text;
        // Finding individual words within line
        // If string.match returns null, default to empty array
        let wordArr = lineText.match(this.#WORD_REGEX) ?? [];
        
        // Second conditional is for cases where user search term is a case-sensitive 
        // phrase like "Hello World".
        // Else statement tries to see if search term is hyphen-breaked
        if (wordArr.includes(searchTerm)) {
            resultArr.push(new SearchResult(
                    pageLineTextObj.page, pageLineTextObj.line, this.#isbn));
        } else if (searchTerm.includes(" ") && lineText.includes(searchTerm)) {
            resultArr.push(new SearchResult(
                    pageLineTextObj.page, pageLineTextObj.line, this.#isbn));
        } else {
            // Note that Object[1] is the same as Object["1"] since 
            // property names are stored as strings
            let subsequentLine = 
                    this.#contentArr[pageLineTextObj.page][pageLineTextObj.line + 1];
            let subsequentLineText = null;
            if (!isNull(subsequentLine)) {
                subsequentLineText = subsequentLine.text;
            }

            if (this.#searchForLineBreakedTerm(
                    searchTerm, lineText, subsequentLineText
                )) {
                /**
                 * If there is a word that wraps to the next line 
                 * (i.e. is hyphen-breaked), perform a look ahead check.
                 * 
                 * If the word wraps to the first line of the next page, then
                 * currently there is no way to confirm if this is the case 
                 * with current knowledge (e.g. we don't know the max number 
                 * of lines on a page, there is no data that maps to this 
                 * or we can derive from)
                 */
                resultArr.push(new SearchResult(
                        pageLineTextObj.page, pageLineTextObj.line, this.#isbn));
                resultArr.push(new SearchResult(
                        pageLineTextObj.page, pageLineTextObj.line + 1, this.#isbn));
            }
        }
    }

    /**
     * Helper method to find a search term that is line-breaked across 
     * two lines with a hyphen.
     * @param {string} searchTerm - Term to be searched in book text, case-sensitive
     * @param {string} currentLineText - Current line text
     * @param {string} subsequentLineText - Line text following the current
     * @returns {boolean} - True if search term does span across two lines; 
     * false otherwise
     */
    #searchForLineBreakedTerm(searchTerm, currentLineText, subsequentLineText) {
        // It is possible that subsequent line is not scanned (undefined)
        if (isNull(subsequentLineText) || !currentLineText.endsWith("-")) {
            return false;
        }

        let lineEnd = currentLineText.match(this.#WORD_REGEX).pop()?.replace("-", "");

        // If current line of text ends with a substring of first part of search term
        // and next line of text starts with the rest of search term, that means
        // we found a word that has been hyphen-breaked
        if (searchTerm.startsWith(lineEnd)) {
            // Cannot use string.endsWith in case a different term can be matched.
            // Have to substring extract what's left over to match
            // E.g. The hyphen-breaked "be-e" will give a false positive match
            // to search term "because"
            let startIndex = lineEnd.length;
            let leftOverStr = searchTerm.substring(startIndex);

            let subsequentLineStart = subsequentLineText.match(this.#WORD_REGEX).shift();

            if (leftOverStr === subsequentLineStart) {
                return true;
            }
        }
        return false;
    }

    /**
     * String representation of scanned book's contents.
     * @returns {string} - JSON string of book's content
     */
    toString() {
        return JSON.stringify(this.#contentArr);
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
        if (typeof(pageOrLineNum) !== "number") {
            throw new Error("Page and/or line number must be a \"number\" type");
        }
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
 * SearchResult class represents a successful match of a search term within a 
 * line on a book's page.
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
            throw new Error(
                    "Invalid ISBN value; must be a 10 or 13 digit string with no delimiters");
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

    /**
     * Converts SearchResult object to JSON format.
     * @returns {object} - JSON format of object
     */
    toJSON() {
        /**
         * This function is needed because in test cases, 
         * caller calls JSON.stringify() which would result 
         * in private properties being stringified in the wrong order
         * (order of var declaration instead of the order 
         * as defined by product requirements).
         * E.g.
         * {
         *     #pageNum: 31,
         *     #lineNum: 9,
         *     #isbn: "9780000528531"
         * }
         */
        return {
            "ISBN": this.#isbn,
            "Page": this.page,
            "Line": this.line
        };
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
        // Note that it is possible for a line to be empty 
        // (e.g. just whitespace for formatting)
        this.#text = text.trim();
    }

    /**
     * Getter for line text attribute.
     * @return {string} - Line text
     */
    get text() {
        return this.#text;
    }

    /**
     * Converts PageLineText object to JSON format.
     * @returns {object} - JSON format of object
     */
    toJSON() {
        return {
            "Page": this.page,
            "Line": this.line,
            "Text": this.#text
        };
    }
}

/**
 * Searches for matches in scanned text.
 * @param {string} searchTerm - The word or term we're searching for. 
 * @param {JSON} scannedTextObj - A JSON object representing the scanned text. 
 * Will not be modified.
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

    let overallResultArr = [];

    // Iterating over each distinct book scanned to find the search term in scanned lines
    // Assume a single book does not have repeated entries in JSON
    for (const bookJSON of scannedTextObj) {
        const bookObj = new Book(bookJSON["Title"], bookJSON["ISBN"], bookJSON["Content"]);
        let resultArr = bookObj.searchForTerm(searchTerm);
        overallResultArr = overallResultArr.concat(resultArr);
    }

    let resultJSON = {
        "SearchTerm": searchTerm,
        "Results": overallResultArr
    };

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
];
    
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
};

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
    console.error("FAIL: Test 1");
    console.error("Expected:", twentyLeaguesOut);
    console.error("Received:", test1result);
}

/** We could choose to check that we get the right number of results. */
const test2result = findSearchTermInBooks("the", twentyLeaguesIn); 
if (test2result.Results.length == 1) {
    console.log("PASS: Test 2");
} else {
    console.error("FAIL: Test 2");
    console.error("Expected:", twentyLeaguesOut.Results.length);
    console.error("Received:", test2result.Results.length);
}

/**
 * Helper method for running tests on a class constructor.
 * @param {string} testName - Name of test
 * @param {object} className - Class name
 * @param {object} args - Array of arguments to pass to constructor 
 * in the order they are stored
 * @param {boolean} shouldPass - True if test is supposed to pass; false otherwise
 */
function constructorTestRunner(testName, className, args, shouldPass) {
    try {
        // Assume className is a valid class with a constructor
        let newObj = new className(...args);
        if (shouldPass) {
            console.log("PASS:", testName, "|", JSON.stringify(newObj), "|", ...args);
        } else {
            console.error("FAIL:", testName, "|", 
                    `${className} should not be instantiated with these arguments:`, ...args);
        }
    } catch(e) {
        if (!shouldPass) {
            console.log("PASS:", testName, "|", e.toString());
        } else {
            console.error("FAIL:", testName, "|", e);
        }
    }
}

// Tests for Book class
console.warn("Testing Book class");
constructorTestRunner(
        "bookConstructorTest",
        Book,
        [twentyLeaguesIn[0]["Title"], 
        twentyLeaguesIn[0]["ISBN"], 
        twentyLeaguesIn[0]["Content"]],
        true
    );
constructorTestRunner("bookEmptyContentTest", Book,["Example title", "9780000528531", []], true);

constructorTestRunner("bookNoArgTest", Book, [], false);
constructorTestRunner("bookNullArgTest", Book, [null, null, null], false);
// Trying to hit as much code coverage as possible which is why passing different
// combinations of arguments
constructorTestRunner("bookNullArgTest", Book, [null, "9780000528531", []], false);
constructorTestRunner("bookNullArgTest", Book, ["Example title", null, []], false);
constructorTestRunner("bookNullArgTest", Book, ["Example title", "9780000528531", null], false);
constructorTestRunner("bookUndefinedArgTest", Book, [undefined, undefined, undefined], false);
constructorTestRunner("bookEmptyTitleTest", Book, ["", "9780000528531", []], false);
constructorTestRunner(
        "bookInvalidContentTest",
        Book,
        ["Example title", "9780000528531", ["Hello There"]],
        false
    );
constructorTestRunner("bookInvalidISBNTest", Book, ["Example title", "1", []], false);

// Tests for static ISBN validation function
if (Book.validateISBN("0000000000000")) {
    console.log("PASS:", "book13DigitISBNValidateTest");
} else {
    console.error("FAIL:", "book13DigitISBNValidateTest");
}

if (Book.validateISBN("0000000000")) {
    console.log("PASS:", "book10DigitISBNValidateTest");
} else {
    console.error("FAIL:", "book10DigitISBNValidateTest");
}

if (!Book.validateISBN("978-0000528531")) {
    console.log("PASS:", "bookISBNDelimiterValidateTest");
} else {
    console.error("FAIL:", "bookISBNDelimiterValidateTest");
}

if (!Book.validateISBN("123")) {
    console.log("PASS:", "bookInvalidISBNValidateTest");
} else {
    console.error("FAIL:", "bookInvalidISBNValidateTest");
}

try {
    Book.validateISBN(9780000528531);
} catch(e) {
    console.log("PASS:", "bookISBNValidateNumberTest", "|", e.toString());
}

// Tests for PageLine abstract class
console.warn("Testing PageLine abstract class");
constructorTestRunner("pageLineConstructorTest", PageLine, [31, 8], false);

// Tests for PageLineText class
console.warn("Testing PageLineText class");
constructorTestRunner("pageLineTextTest", PageLineText, [31, 8, "Example text"], true);
constructorTestRunner("pageLineTextEmptyStringTest", PageLineText, [31, 8, ""], true);

constructorTestRunner("pageLineTextNoArgTest", PageLineText, [], false);
constructorTestRunner("pageLineTextNullArgTest", PageLineText, [null, null, null], false);
constructorTestRunner(
        "pageLineTextNullArgTest", PageLineText, [null, 8, "Example text"], false);
constructorTestRunner(
        "pageLineTextNullArgTest", PageLineText, [31, null, "Example text"], false);
constructorTestRunner("pageLineTextNullArgTest", PageLineText, [31, 8, null], false);
constructorTestRunner(
        "pageLineTextUndefinedArgTest", PageLineText, [undefined, undefined, undefined], false);
constructorTestRunner(
        "pageLineTextInvalidPageNumTest", PageLineText, [-1, 8, "Example text"], false);
constructorTestRunner(
        "pageLineTextInvalidLineNumTest", PageLineText, [31, -1, "Example text"], false);
constructorTestRunner("pageLineTextInvalidTextTest", PageLineText, [31, -1, null], false);

// Extremity tests
constructorTestRunner("pageLinePage0Line1Test", PageLineText, [0, 1, ""], false);
constructorTestRunner("pageLinePage1Line0Test", PageLineText, [1, 0, ""], false);
constructorTestRunner(
        "pageLinePage1LineMaxIntegerTest", PageLineText, [1, Number.MAX_SAFE_INTEGER, ""], true);

// Tests for SearchResult class
console.warn("Testing SearchResult class");
constructorTestRunner("searchResultTest", SearchResult, [31, 8, "9780000528531"], true);

constructorTestRunner("searchResultNoArgTest", SearchResult, [], false);
constructorTestRunner("searchResultNullTest", SearchResult, [null, null, null], false);
constructorTestRunner("searchResultNullTest", SearchResult, [null, 8, "978000052831"], false);
constructorTestRunner("searchResultNullTest", SearchResult, [31, null, "978000052831"], false);
constructorTestRunner("searchResultNullTest", SearchResult, [31, 8, null], false);
constructorTestRunner(
        "searchResultUndefinedTest", SearchResult, [undefined, undefined, undefined], false);
constructorTestRunner("searchResultInvalidISBNTest", SearchResult, [31, 8, "978000052831"], false);
constructorTestRunner("searchResultInvalidISBNTest", SearchResult, [31, 8, 9780000528531], false);
constructorTestRunner(
        "searchResultInvalidPageNumTest", SearchResult, [-1, 8, "9780000528531"], false);
constructorTestRunner(
        "searchResultInvalidLineNumTest", SearchResult, [8, -1, "9780000528531"], false);

// Tests for findSearchTermInBooks()
console.warn("Testing findSearchTermInBooks()");
const emptyInputTest = findSearchTermInBooks("the", []);
if (emptyInputTest.Results.length === 0) {
    console.log("PASS: Empty input test");
} else {
    console.error("FAIL: Empty input test");
    console.error("Expected:", JSON.stringify([]));
    console.error("Received:", JSON.stringify(emptyInputTest.Results));
}

const noResultTest = findSearchTermInBooks("Supercalifragilistic", twentyLeaguesIn);
if (noResultTest.Results.length === 0) {
    console.log("PASS: No result test");
} else {
    console.error("FAIL: No result test");
    console.error("Expected:", JSON.stringify([]));
    console.error("Received:", JSON.stringify(noResultTest.Results));
}

const caseSensitiveFailTest = findSearchTermInBooks("Profound", twentyLeaguesIn);
if (caseSensitiveFailTest.Results.length === 0) {
    console.log("PASS: Case sensitive fail test");
} else {
    console.error("FAIL: Case sensitive fail test");
    console.error("Expected:", JSON.stringify([]));
    console.error("Received:", JSON.stringify(caseSensitiveFailTest.Results));
}

const caseSensitiveFailAllCapsTest = findSearchTermInBooks("PROFOUND", twentyLeaguesIn);
if (caseSensitiveFailAllCapsTest.Results.length === 0) {
    console.log("PASS: Case sensitive all capital letters fail test");
} else {
    console.error("FAIL: Case sensitive all capital letters fail test");
    console.error("Expected:", JSON.stringify([]));
    console.error("Received:", JSON.stringify(caseSensitiveFailAllCapsTest.Results));
}

const caseSensitiveSuccessTestExpected = {
    "SearchTerm": "profound",
    "Results": [
        {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
        }
    ]
};
const caseSensitiveSuccessTest = findSearchTermInBooks("profound", twentyLeaguesIn);
if (JSON.stringify(caseSensitiveSuccessTestExpected) === 
        JSON.stringify(caseSensitiveSuccessTest)) {
    console.log("PASS: Case sensitive success test |", JSON.stringify(caseSensitiveSuccessTest));
} else {
    console.error("FAIL: Case sensitive success test");
    console.error("Expected:", JSON.stringify(caseSensitiveSuccessTestExpected));
    console.error("Received:", JSON.stringify(caseSensitiveSuccessTest));
}

const contractionTest = findSearchTermInBooks("Canadian's", twentyLeaguesIn);
const constractionTestExpected = {
    "SearchTerm": "Canadian's",
    "Results": [
        {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
        }
    ]
};
if (JSON.stringify(constractionTestExpected) === JSON.stringify(contractionTest)) {
    console.log("PASS: Contraction and possessive nouns test");
} else {
    console.error("FAIL: Contraction and possessive nouns test");
    console.error("Expected:", JSON.stringify(constractionTestExpected));
    console.error("Received:", JSON.stringify(contractionTest.Results));
}

const substringOfWordTest = findSearchTermInBooks("Canadian", twentyLeaguesIn);
if (substringOfWordTest.Results.length === 0) {
    console.log("PASS: Substring of word test");
} else {
    console.error("FAIL: Substring of word test");
    console.error("Expected:", JSON.stringify([]));
    console.error("Received:", JSON.stringify(substringOfWordTest.Results));
}

const substringOfLineBreakWordTest = findSearchTermInBooks("dark", twentyLeaguesIn);
if (substringOfLineBreakWordTest.Results.length === 0) {
    console.log("PASS: Substring of line-breaked word test");
} else {
    console.error("FAIL: Substring of line-breaked word test");
    console.error("Expected:", JSON.stringify([]));
    console.error("Received:", JSON.stringify(substringOfLineBreakWordTest.Results));
}

const findLineBreakTermTest = findSearchTermInBooks("darkness", twentyLeaguesIn);
const findLineBreakTermTestExpected = {
    "SearchTerm": "darkness",
    "Results": [
        {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 8
        },
        {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
        }
    ]
};
if (JSON.stringify(findLineBreakTermTestExpected) === 
        JSON.stringify(findLineBreakTermTest)) {
    console.log("PASS: Find line-breaked term test |", findLineBreakTermTest)
} else {
    console.error("FAIL: Find line-breaked term test");
    console.error("Expected:", JSON.stringify(findLineBreakTermTestExpected));
    console.error("Received:", JSON.stringify(findLineBreakTermTest));
}

const sampleBook = [
    {
        "Title": "Example title",
        "ISBN": "9780618260300",
        "Content": [
            {
                "Page": 1,
                "Line": 1,
                "Text": "This is a déjà vu story about a pre-owned toy with a résumé"
            }
        ]
    }
];
const findHyphenatedTermTest = findSearchTermInBooks("pre-owned", sampleBook);
const findHyphenatedTermTestExpected = {
    "SearchTerm": "pre-owned",
    "Results": [
        {
            "ISBN": "9780618260300",
            "Page": 1,
            "Line": 1
        }
    ]
};
if (JSON.stringify(findHyphenatedTermTestExpected) === 
        JSON.stringify(findHyphenatedTermTest)) {
    console.log("PASS: Find hyphenated term test |", findHyphenatedTermTest);
} else {
    console.error("FAIL: Find hyphenated term test");
    console.error("Expected:", JSON.stringify(findHyphenatedTermTestExpected));
    console.error("Received:", JSON.stringify(findHyphenatedTermTest));
}

const findAccentedTermTest = findSearchTermInBooks("résumé", sampleBook);
const findAccentedTermTestExpected = {
    "SearchTerm": "résumé",
    "Results": [
        {
            "ISBN": "9780618260300",
            "Page": 1,
            "Line": 1
        }
    ]
};
if (JSON.stringify(findAccentedTermTestExpected) === 
        JSON.stringify(findAccentedTermTest)) {
    console.log("PASS: Find accented term test |", findAccentedTermTest);
} else {
    console.error("FAIL: Find accented term test");
    console.error("Expected:", JSON.stringify(findAccentedTermTestExpected));
    console.error("Received:", JSON.stringify(findAccentedTermTest));
}

const findTermWithSpaceTest = findSearchTermInBooks("déjà vu", sampleBook);
const findTermWithSpaceTestExpected = {
    "SearchTerm": "déjà vu",
    "Results": [
        {
            "ISBN": "9780618260300",
            "Page": 1,
            "Line": 1
        }
    ]
};
if (JSON.stringify(findTermWithSpaceTestExpected) === 
        JSON.stringify(findTermWithSpaceTest)) {
    console.log("PASS: Find term with space test |", findTermWithSpaceTest);
} else {
    console.error("FAIL: Find term with space test");
    console.error("Expected:", JSON.stringify(findTermWithSpaceTestExpected));
    console.error("Received:", JSON.stringify(findTermWithSpaceTest));
}

const lordOfTheRings = [
    {
        "Title": "Fellowship of the Ring",
        "ISBN": "9780007149216",
        "Content": [
            {
                "Page": 455,
                "Line": 36,
                "Text": "'As was agreed, I shall here blindfold the eyes of Gimli the"
            },
            {
                "Page": 348,
                "Line": 41,
                "Text": "'Could we not still send messages to him and obtain his"
            }
        ] 
    },
    {
        "Title": "The Two Towers",
        "ISBN": "0345339711",
        "Content": [
            {
                "Page": 4,
                "Line": 1,
                "Text": "As he ran the cries came louder, but fainter now and des-"
            },
            {
                "Page": 12,
                "Line": 7,
                "Text": "Like a deer he sprang away. Through the trees he sped. On"
            },
            {
                "Page": 6,
                "Line": 11,
                "Text": "'And I,' said Legolas, 'will take all the arrows that I can"
            }
        ] 
    },
    {
        "Title": "The Return of the King",
        "ISBN": "0007488343",
        "Content": [
            {
                "Page": 846,
                "Line": 1,
                "Text": "'It is also called kingsfoil,' said Aragorn: 'and maybe you know it by that"
            },
            {
                "Page": 823,
                "Line": 35,
                "Text": "clenched his hand. She should not die, so fair, so desparate! At least she"
            },
            {
                "Page": 913,
                "Line": 20,
                "Text": "'So that was the job I felt I had to do when I started,' thought Sam: 'to"
            }
        ] 
    },
    {
        "Title": "The Hobbit",
        "ISBN": "0618260307",
        "Content": []
    },
    {
        "Title": "The Silmarillion",
        "ISBN": "0618126988",
        "Content": [
            {
                "Page": 1,
                "Line": 1,
                "Text": ""
            }
        ]
    }
];
const findTermInMultipleBooksTest = findSearchTermInBooks("I", lordOfTheRings);
const findTermInMultipleBooksTestExpected = {
    "SearchTerm": "I",
    "Results": [
        {
            "ISBN": "9780007149216",
            "Page": 455,
            "Line": 36
        },
        {
            "ISBN": "0345339711",
            "Page": 6,
            "Line": 11
        },
        {
            "ISBN": "0007488343",
            "Page": 913,
            "Line": 20
        }
    ]
};
if (JSON.stringify(findTermInMultipleBooksTestExpected) === 
        JSON.stringify(findTermInMultipleBooksTest)) {
    console.log("PASS: Find term in multiple books test |", findLineBreakTermTest);
} else {
    console.error("FAIL: Find term in multiple books test");
    console.error("Expected:", JSON.stringify(findTermInMultipleBooksTestExpected));
    console.error("Received:", JSON.stringify(findTermInMultipleBooksTest));
}
