export default function decorate(block) {
  const [personWrapper] = block.children;

  const personinfo = document.createElement('person-info');
  personinfo.setAttribute('host', 'https://publish-p110498-e1334763.adobeaemcloud.com');
  personinfo.setAttribute('query-param-value', 'John Doe');
  personWrapper.replaceChildren(personinfo);
}
