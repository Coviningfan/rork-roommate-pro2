// Update the variable name
const [signDocumentModalVisible, setSignDocumentModalVisible] = useState(false);

// Replace all occurrences of setSignatureModalVisible with setSignDocumentModalVisible
// In the handleSendForSignature function:
setSignDocumentModalVisible(false);

// In the openSignatureModal function:
setSignDocumentModalVisible(true);