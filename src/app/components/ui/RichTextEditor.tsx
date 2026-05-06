import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Undo, Redo, Code, Minus } from 'lucide-react'
import { uploadImage, JOURNAL_IMAGES_BUCKET } from '../../data/supabaseData'
import { useRef } from 'react'
import { toast } from 'sonner'

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Write your story here...", minHeight = "300px" }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none p-6 min-h-[${minHeight}]`,
      },
    },
  })

  // Ensure content updates if value prop changes externally (e.g. loading editing data)
  if (editor && value && editor.getHTML() !== value) {
    // Basic check to prevent cursor jumping
    setTimeout(() => {
      if (editor.getHTML() !== value) {
        editor.commands.setContent(value, { emitUpdate: false })
      }
    }, 0)
  }

  if (!editor) {
    return null
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadImage(file, JOURNAL_IMAGES_BUCKET)
      editor.chain().focus().setImage({ src: url }).run()
      toast.success('Image inserted')
    } catch (err) {
      toast.error('Failed to upload image')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href
    if (previousUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    const url = window.prompt('URL')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const MenuButton = ({ onClick, isActive, icon: Icon, title }: { onClick: () => void, isActive?: boolean, icon: any, title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  )

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-input-background focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} title="Heading 3" />
        <div className="w-px h-4 bg-border mx-1" />
        
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
        <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={Code} title="Code" />
        <div className="w-px h-4 bg-border mx-1" />
        
        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Numbered List" />
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />
        <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} title="Divider" />
        <div className="w-px h-4 bg-border mx-1" />
        
        <MenuButton onClick={toggleLink} isActive={editor.isActive('link')} icon={LinkIcon} title="Link" />
        <MenuButton onClick={() => fileInputRef.current?.click()} icon={ImageIcon} title="Insert Image" />
        
        <div className="w-px h-4 bg-border mx-1 flex-1 min-w-[1px]" />
        
        <MenuButton onClick={() => editor.chain().focus().undo().run()} icon={Undo} title="Undo" />
        <MenuButton onClick={() => editor.chain().focus().redo().run()} icon={Redo} title="Redo" />
      </div>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <div className="custom-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <EditorContent editor={editor} className="tiptap-editor cursor-text" onClick={() => editor.commands.focus()} />
      </div>
    </div>
  )
}
