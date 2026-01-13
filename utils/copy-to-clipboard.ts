const unsecuredCopyToClipboard = (text) => {
  const textArea = document.createElement("textarea")
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand("copy")
  } catch (err) {
    console.error("Unable to copy to clipboard", err)
  }
  document.body.removeChild(textArea)
}

const copyToClipboard = (content) => {
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(content)
  } else {
    unsecuredCopyToClipboard(content)
  }
}

export default copyToClipboard
