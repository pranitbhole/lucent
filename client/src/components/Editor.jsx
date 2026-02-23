import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold as BoldIcon, Italic as ItalicIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  Undo, Redo, Minus
} from "lucide-react";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { CheckSquare } from "lucide-react";


export default function Editor({ content, onChange }) {
  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      HorizontalRule,
      History,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: () => forceUpdate((n) => n + 1),
    onTransaction: () => forceUpdate((n) => n + 1),
    editorProps: {
      attributes: {
        class: "min-h-[500px] focus:outline-none text-gray-300 leading-relaxed text-base",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!editor) return null;

  const btn = (title, icon, action, active) => (
    <button
      key={title}
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-white text-gray-900"
          : "text-gray-400 hover:bg-gray-700 hover:text-white"
      }`}
    >
      {icon}
    </button>
  );

  const divider = (key) => (
    <div key={key} className="w-px h-5 bg-gray-700 mx-1" />
  );

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-0.5 flex-wrap border border-gray-700 rounded-lg px-2 py-1.5 mb-5 bg-gray-800/50">
        {btn("Bold", <BoldIcon size={15} />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {btn("Italic", <ItalicIcon size={15} />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {btn("Strikethrough", <Strikethrough size={15} />, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}

        {divider("d1")}

        {btn("Heading 1", <Heading1 size={15} />, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 }))}
        {btn("Heading 2", <Heading2 size={15} />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {btn("Heading 3", <Heading3 size={15} />, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}

        {divider("d2")}

        {btn("Bullet List", <List size={15} />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {btn("Ordered List", <ListOrdered size={15} />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {btn("Blockquote", <Quote size={15} />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
        {btn("Todo List", <CheckSquare size={15} />, () => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList"))}
        {btn("Horizontal Rule", <Minus size={15} />, () => editor.chain().focus().setHorizontalRule().run(), false)}

        {divider("d3")}

        {btn("Undo", <Undo size={15} />, () => editor.chain().focus().undo().run(), false)}
        {btn("Redo", <Redo size={15} />, () => editor.chain().focus().redo().run(), false)}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}