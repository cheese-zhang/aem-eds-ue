export default function decorate(block) {
  const [personWrapper] = block.children;
  const section = document.createElement('section');
  section.classList.add('rail');
  // person
  const personinfo = document.createElement('person-info');
  personinfo.setAttribute('host', 'https://author-p110498-e1334763.adobeaemcloud.com');
  personinfo.setAttribute('query-param-value', 'John Doe');
  // tip
  const tips = document.createElement('h2');
  tips.textContent = '↓ The web component ↓';
  // description
  const description = document.createElement('p');
  description.textContent = 'The above "person" is displayed using a web component that sources it\'s content from AEM\n' +
    '      Headless GraphQL APIs.';
  section.appendChild(tips);
  section.appendChild(personinfo);
  section.appendChild(description);

  personWrapper.replaceChildren(section);
}

// Defines the Headless Service object w/ properties
const aemHeadlessService = {
  aemHost: 'https://author-p110498-e1334763.adobeaemcloud.com',
  graphqlAPIEndpoint: 'graphql/execute.json',
  projectName: 'my-project',
  persistedQueryName: 'person-by-name',
  queryParamName: 'name',
};

// eslint-disable-next-line max-len
// Person Info HTML block which will be added as HTML Template and appended to shadow DOM upon JSON Value replacements
const personInfoHTML = `
  <div class="person">
    <img
      class="person_image"
      src="{IMG-SRC}"
      alt="{FULL-NAME}"
    />
    <div class="person_occupations">
      {OCCUPATION}
    </div>
    <div class="person_content">
      <h1 class="person_full-name">{FULL-NAME}</h1>
      <div class="person_biography">{BIOGRAPHY-TEXT}</div>
    </div>
  </div>
`;

// Create a Class for our Custom Element (person-info)
class PersonInfo extends HTMLElement {
  constructor() {
    super();

    // Create a shadow root
    const shadowRoot = this.attachShadow({ mode: 'open' });

    // init Shadow DOM specific CSS
    this.initStyles();
  }

  // lifecycle callback :: When custom element is appended to document
  connectedCallback() {
    // get attribute values from the 'person-info' custom element
    const host = this.getAttribute('host');
    const queryParamValue = this.getAttribute('query-param-value');

    const headlessAPIURL = this.buildHeadlessAPIURL(host);
    console.log(`Using AEM Headless API URL:${headlessAPIURL}`);

    this.fetchPersonByNamePersistedQuery(headlessAPIURL, queryParamValue)
      .then(
        ({
          data,
          err,
        }) => {
          if (err) {
            console.log('Error while fetching data');
          } else if (data?.personList?.items.length === 1) {
            this.renderPersonInfoViaTemplate(data.personList.items[0], host);
            //this.renderPersonInfoViaReplace(data.personList.items[0], host);
            //this.renderPersonInfoViaDocumentAPIs(data.personList.items[0], host);
          } else {
            console.log(`Cannot find person with name: ${queryParamValue}`);
          }
        },
      );
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchPersonByNamePersistedQuery(headlessAPIURL, queryParamValue) {
    let data;
    let err;
    // encode URI params
    const encodedParam = encodeURIComponent(
      `;${aemHeadlessService.queryParamName}=${queryParamValue}`,
    );
    try {
      // Make XHR call to AEM
      const response = await fetch(`${headlessAPIURL}/${aemHeadlessService.persistedQueryName}${encodedParam}`);
      if (!response.ok) {
        console.log('ERROR:Could not load data from AEM');
      }

      // Get JSON response
      const responseData = await response.json();

      // The GraphQL data is stored on the response's data field
      data = responseData?.data;
    } catch (e) {
      // An error occurred, return the error messages
      // eslint-disable-next-line no-shadow
      const error = e.toJSON()?.map((error) => error.message)?.join(', ');
      console.error(error);
    }

    return {
      data,
      err,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  buildHeadlessAPIURL(host) {
    let headlessAPIURL = '';

    // eslint-disable-next-line max-len
    // If host is passed via Custom Element attribute, else use default value from 'aemHeadlessService.aemHost'
    if (host) {
      headlessAPIURL = [
        host,
        aemHeadlessService.graphqlAPIEndpoint,
        aemHeadlessService.projectName,
      ].join('/');
    } else {
      headlessAPIURL = [
        aemHeadlessService.aemHost,
        aemHeadlessService.graphqlAPIEndpoint,
        aemHeadlessService.projectName,
      ].join('/');
    }

    return headlessAPIURL;
  }

  renderPersonInfoViaTemplate(person, host) {
    const personTemplateElement = document.getElementById('person-template');

    const templateContent = personTemplateElement.content;

    const personImgElement = templateContent.querySelector('.person_image');
    personImgElement.setAttribute('src', host + (person.profilePicture._dynamicUrl || person.profilePicture._path));
    personImgElement.setAttribute('alt', person.fullName);

    const personFullNameElement = templateContent.querySelector('.person_full-name');
    personFullNameElement.textContent = person.fullName;

    const personBioElement = templateContent.querySelector('.person_biography');
    personBioElement.textContent = person.biography.json[0].content[0].value;

    const personOccupationsElement = templateContent.querySelector('.person_occupations');
    personOccupationsElement.innerHTML = '';

    // eslint-disable-next-line array-callback-return
    person.occupation.map((occupationItem) => {
      personOccupationsElement.innerHTML = `${personOccupationsElement.innerHTML}<span class="person_occupation">${occupationItem}</span>`;
    });

    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }

  // Define and apply this Person Info Specific Styles
  initStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .person {
            position: relative;
            margin-bottom: 2rem;
        }
          
        .person .person_image {
            width: 100%;
            height: 400px;
            object-fit: cover;
            object-position: center;
        }
          
        .person .person_occupations {
            position: absolute;
            top: 0;
            right: 0;
        }
          
        .person .person_occupation {
            background-color: #FFEA00;
            padding: 1rem 1.5rem;
            display: inline-block;
            margin: 1rem 1rem 0 0;
            text-transform: uppercase;
            font-weight: bold;
        }
          
        .person .person_content {
            margin: -9rem 10% 0 10%;
            background-color: white;
            position: relative;
            padding: 1rem 2rem;
        }
          
        .person .person_content .person_full-name {
            margin-bottom: 2rem;
        }
        `;

    console.log('Added Styles');
    this.shadowRoot.appendChild(styleElement);
  }
}

// Create and add 'person-template' to the document as IIFE
(() => {
  let personTemplateElement = document.getElementById('person-template');

  if (!personTemplateElement) {
    personTemplateElement = document.createElement('template');
    personTemplateElement.setAttribute('id', 'person-template');
    personTemplateElement.innerHTML = personInfoHTML;

    document.body.append(personTemplateElement);
  } else {
    console.log('Template is present, no need to add again');
  }
})();

// Define the person-info element
customElements.define('person-info', PersonInfo);
