// src/components/ui/RichTextEditor.tsx
'use client'

import { useRef, useEffect, useState } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, X } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  id?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type your message here...',
  rows = 4,
  className = '',
  id
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const savedRangeRef = useRef<Range | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0)
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange()
      }
    }
  }

  const restoreSelection = () => {
    if (savedRangeRef.current && editorRef.current) {
      const selection = window.getSelection()
      if (selection) {
        try {
          selection.removeAllRanges()
          selection.addRange(savedRangeRef.current)
          return true
        } catch (e) {
          // Invalid range, place cursor at end
          const range = document.createRange()
          range.selectNodeContents(editorRef.current)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
          return false
        }
      }
    }
    return false
  }

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      const textContent = editorRef.current.textContent?.trim() || ''
      onChange(textContent ? html : '')
    }
  }

  const handleMouseUp = () => {
    saveSelection()
  }

  const handleKeyUp = () => {
    saveSelection()
  }

  const formatText = (command: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!editorRef.current) return
    
    editorRef.current.focus()
    if (!restoreSelection()) {
      saveSelection()
    }
    
    document.execCommand(command, false, undefined)
    handleInput()
    saveSelection()
  }

  const insertList = (ordered: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    if (!editorRef.current) return
    
    editorRef.current.focus()
    const restored = restoreSelection()
    if (!restored) {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      selection?.removeAllRanges()
      selection?.addRange(range)
      saveSelection()
    }
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const selectedText = selection.toString().trim()
    
    // Always use direct DOM manipulation for reliability
    range.deleteContents()
    
    const listTag = ordered ? 'ol' : 'ul'
    const listElement = document.createElement(listTag)
    
    if (selectedText) {
      const lines = selectedText.split('\n').filter(line => line.trim())
      lines.forEach(line => {
        const li = document.createElement('li')
        li.textContent = line.trim()
        listElement.appendChild(li)
      })
    } else {
      const li = document.createElement('li')
      listElement.appendChild(li)
    }
    
    range.insertNode(listElement)
    
    // Place cursor in first list item
    const firstLi = listElement.querySelector('li')
    if (firstLi) {
      const newRange = document.createRange()
      newRange.selectNodeContents(firstLi)
      newRange.collapse(false)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
    
    handleInput()
    saveSelection()
  }

  const insertLink = (e: React.MouseEvent) => {
    e.preventDefault()
    saveSelection()
    setShowLinkModal(true)
  }

  const handleInsertLink = () => {
    if (!linkUrl.trim() || !editorRef.current) return
    
    let url = linkUrl.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
      url = 'https://' + url
    }
    
    setShowLinkModal(false)
    const urlToInsert = url
    
    setTimeout(() => {
      if (!editorRef.current) return
      
      editorRef.current.focus()
      const selection = window.getSelection()
      
      // Try to restore selection
      let range: Range
      if (savedRangeRef.current && editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
        try {
          selection?.removeAllRanges()
          selection?.addRange(savedRangeRef.current)
          range = selection?.getRangeAt(0)!
        } catch (e) {
          range = document.createRange()
          range.selectNodeContents(editorRef.current)
          range.collapse(false)
        }
      } else {
        range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
      }
      
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      const selectedText = selection?.toString().trim() || urlToInsert
      
      // Always use direct DOM manipulation for reliability
      range.deleteContents()
      const linkElement = document.createElement('a')
      linkElement.href = urlToInsert
      linkElement.textContent = selectedText
      range.insertNode(linkElement)
      
      // Move cursor after the link
      const newRange = document.createRange()
      newRange.setStartAfter(linkElement)
      newRange.collapse(true)
      selection?.removeAllRanges()
      selection?.addRange(newRange)
      
      handleInput()
      saveSelection()
      setLinkUrl('')
    }, 50)
  }

  const handleCancelLink = () => {
    setShowLinkModal(false)
    setLinkUrl('')
    editorRef.current?.focus()
  }

  return (
    <div className={`border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => formatText('bold', e)}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => formatText('italic', e)}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => formatText('underline', e)}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => insertList(false, e)}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => insertList(true, e)}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => insertLink(e)}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        id={id}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`px-3 py-2 outline-none ${
          isFocused ? '' : 'text-gray-500'
        }`}
        style={{
          minHeight: `${rows * 1.5}rem`,
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <LinkIcon className="w-5 h-5 text-teal-600 mr-2" />
                Insert Link
              </h3>
              <button
                onClick={handleCancelLink}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="link-url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="text"
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleInsertLink()
                    }
                    if (e.key === 'Escape') {
                      handleCancelLink()
                    }
                  }}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL (http://, https://) or email address (mailto:)
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelLink}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
