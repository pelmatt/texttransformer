// Function to call OpenAI API
async function callOpenAI(apiKey, messageContent) {
  let response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: messageContent
      }],
      temperature: 0.7
    })
  });

  let data = await response.json();
  return data.choices[0].message.content.trim();
}

// Reading uploaded file
document.getElementById('fileInput').addEventListener('change', function() {
  const reader = new FileReader();
  reader.onload = function() {
    document.getElementById('fileContent').value = reader.result;
  };
  reader.readAsText(this.files[0]);
}, false);

// Button click event
document.getElementById('transformButton').addEventListener('click', async function() {
  const apiKey = document.getElementById('apiKey').value;
  const userPrompt = document.getElementById('userPrompt').value;
  let originalText = document.getElementById('fileContent').value;

  // Replace speech marks with @SPEECHMARKER@
  originalText = originalText.replace(/\"/g, '@DOUBLE_SPEECHMARKER@');
  originalText = originalText.replace(/\'/g, '@SINGLE_SPEECHMARKER@');

  // Use compromise for sentence detection
  const doc = nlp(originalText);
  let sentences = doc.sentences().out('array');

  sentences = sentences.map(sentence => 
    sentence.replace(/@DOUBLE_SPEECHMARKER@/g, '\"').replace(/@SINGLE_SPEECHMARKER@/g, "\'")
  );

  let transformedText = "";
  let context = "";

  for (let i = 0; i < sentences.length; i++) {
  const sentence = sentences[i].trim();
  if (!sentence) continue;

  const prevContext = sentences.slice(Math.max(i - 5, 0), i);
  const nextContext = sentences.slice(i + 1, i + 6);

  const messageContent = [
    `Here is the user's prompt: ${userPrompt}`,
    `Here is the wider context: ${prevContext}  ${sentence}  ${nextContext}`, 
    `Here is the sentence to transform: ${sentence}`
  ].join('\n');
  
  const transformedSentence = await callOpenAI(apiKey, messageContent);

  // Check if the transformed sentence already ends with a full stop
  const appendFullStop = transformedSentence.endsWith('.') ? ' ' : '. ';

  context += transformedSentence + appendFullStop;
  transformedText += transformedSentence + appendFullStop;
}

  // Post-process the transformed text to remove double full stops, spaces, and unspaced full stops
  transformedText = transformedText.replace(/\. \. /g, '. ').replace(/  +/g, ' ').replace(/\.\./g, '.');


  if (typeof transformedText !== 'undefined') {
    document.getElementById("transformedContent").value = transformedText.trim();
  }
  
  
});

// Update the 'transformedContent' text area with the transformed text
if (typeof transformedText !== 'undefined') {
  document.getElementById("transformedContent").value = transformedText;
}
