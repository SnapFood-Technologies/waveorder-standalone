// src/components/ui/RichTextEditor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import UnderlineExtension from '@tiptap/extension-underline'
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, X } from 'lucide-react'
import { useState, useEffect } from 'react'

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
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-teal-600 underline',
        },
      }),
      UnderlineExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-3 py-2`,
        style: `min-height: ${rows * 1.5}rem;`,
        'data-placeholder': placeholder,
      },
    },
  })

  const insertLink = () => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    
    if (selectedText) {
      setLinkUrl('')
      setShowLinkModal(true)
    } else {
      setLinkUrl('')
      setShowLinkModal(true)
    }
  }

  const handleInsertLink = () => {
    if (!editor || !linkUrl.trim()) return
    
    let url = linkUrl.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
      url = 'https://' + url
    }
    
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    
    if (selectedText) {
      // Wrap selected text in link
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      // Insert link with URL as text
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
    }
    
    setShowLinkModal(false)
    setLinkUrl('')
  }

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
            editor.isActive('bold') ? 'bg-gray-200' : ''
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
            editor.isActive('italic') ? 'bg-gray-200' : ''
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
            editor.isActive('underline') ? 'bg-gray-200' : ''
          }`}
          title="Underline"
        >
          <Underline className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-200' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-200' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={insertLink}
          className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
            editor.isActive('link') ? 'bg-gray-200' : ''
          }`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Editor */}
      <div
        id={id}
        style={{
          minHeight: `${rows * 1.5}rem`,
        }}
        className="prose prose-sm max-w-none"
      >
        <EditorContent editor={editor} />
      </div>

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
                onClick={() => {
                  setShowLinkModal(false)
                  setLinkUrl('')
                }}
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
                      setShowLinkModal(false)
                      setLinkUrl('')
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
                  onClick={() => {
                    setShowLinkModal(false)
                    setLinkUrl('')
                  }}
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
