import React, { useState, useEffect } from 'react';

// --- Interfaces ---
interface CrmColumnSettings {
  id: string | number;
  title: string;
  icon: string;
  visible: boolean;
  deletable?: boolean;
  description?: string;
  ai_actions?: { title: string; description: string; active: boolean }[];
  tagIcon?: string;
  tagTitle?: string;
}

interface Classification {
  text: string;
  icon: string;
}

interface CRMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: CrmColumnSettings[];
  onSave: (columns: CrmColumnSettings[]) => void;
  classifications: Classification[];
  onClassificationsChange: (classifications: Classification[]) => void;
  canCustomize?: boolean;
}

// --- Icons ---
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const iconCategories = [
  {
    name: 'Emoções',
    icons: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😊', '🤔', '🎉', '🥳', '😢', '😠', '😎', '🤩', '😴', '👋', '👍', '👎', '🤝']
  },
  {
    name: 'Animais',
    icons: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🦃', '🐓', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🦔', '🐿️', '🦔']
  },
  {
    name: 'Comidas',
    icons: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🥝', '🍾']
  },
  {
    name: 'Objetos',
    icons: ['⌚️', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💴', '💵', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '📧', '🗓️', '🎁', '🛍️', '💳', '✂️', '💅', '💄', '📱', '💻', '🔔', '❗️', '❓', '🚩', '📍', '🔗', '🔑', '✨', '🚀', '🎯', '🏆', '🥇', '🥈', '🥉']
  },
  {
    name: 'Esportes',
    icons: ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🪂']
  },
  {
    name: 'Viagens',
    icons: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '🚀', '✈️', '🛩️', '🛫', '🛬', '🪂', '⛵️', '🚤', '🛥️', '🛳️', '⚓️', '⛽️', '🚧', '🚨', '🚥', '🚦', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲️', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺️', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪️', '🕌', '🕍', '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁']
  },
  {
    name: 'Natureza',
    icons: ['🌳', '🌲', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🌺', '🌻', '🌹', '🥀', '🌷', '💐', '🌸', '🌼', '🌱', '🌰', '🦀', '🐚', '🐌', '🐛', '🦋', '🐝', '🐞', '🐜', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🦑', '🐙', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🦃', '🐓', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🦔', '🐿️', '🦔']
  },
  {
    name: 'Símbolos',
    icons: ['🎂', '✅', '❌', '🔄', '⏳', '🆕', '👤', '💎', '👑', '📞', '💬', '💰', '⭐', '❤️', '🔥', '💡', '📌', '⚙️', '📈', '📉']
  },
  {
    name: 'Corações',
    icons: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '❤️‍🔥', '❤️‍🩹', '🫶', '🫀', '🫁', '🧑‍🍼', '👩‍🍼', '👨‍🍼', '🧑‍🎓', '👩‍🎓', '👨‍🎓', '🧑‍🏫', '👩‍🏫', '👨‍🏫', '🧑‍🏭', '👩‍🏭', '👨‍🏭', '🧑‍💼', '👩‍💼', '👨‍💼', '🧑‍🔬', '👩‍🔬', '👨‍🔬', '🧑‍💻', '👩‍💻', '👨‍💻', '🧑‍🎨', '👩‍🎨', '👨‍🎨', '🧑‍✈️', '👩‍✈️', '👨‍✈️', '🧑‍🚀', '👩‍🚀', '👨‍🚀', '🧑‍⚕️', '👩‍⚕️', '👨‍⚕️', '🧑‍🌾', '👩‍🌾', '👨‍🌾', '🧑‍🍳', '👩‍🍳', '👨‍🍳', '🧑‍🔧', '👩‍🔧', '👨‍🔧', '🧑‍🏗️', '👩‍🏗️', '👨‍🏗️', '🧑‍⚖️', '👩‍⚖️', '👨‍⚖️', '🧑‍🚒', '👩‍🚒', '👨‍🚒', '🧑‍🦰', '👩‍🦰', '👨‍🦰', '🧑‍🦱', '👩‍🦱', '👨‍🦱', '🧑‍🦳', '👩‍🦳', '👨‍🦳', '🧑‍🦲', '👩‍🦲', '👨‍🦲', '🧑‍🏭', '👩‍🏭', '👨‍🏭', '🧑‍💼', '👩‍💼', '👨‍💼', '🧑‍🔬', '👩‍🔬', '👨‍🔬', '🧑‍💻', '👩‍💻', '👨‍💻', '🧑‍🎨', '👩‍🎨', '👨‍🎨', '🧑‍✈️', '👩‍✈️', '👨‍✈️', '🧑‍🚀', '👩‍🚀', '👨‍🚀', '🧑‍⚕️', '👩‍⚕️', '👨‍⚕️', '🧑‍🌾', '👩‍🌾', '👨‍🌾', '🧑‍🍳', '👩‍🍳', '👨‍🍳', '🧑‍🔧', '👩‍🔧', '👨‍🔧', '🧑‍🏗️', '👩‍🏗️', '👨‍🏗️', '🧑‍⚖️', '👩‍⚖️', '👨‍⚖️', '🧑‍🚒', '👩‍🚒', '👨‍🚒']
  },
  {
    name: 'Profissões',
    icons: ['👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮‍♂️', '👮‍♀️', '🕵️‍♂️', '🕵️‍♀️', '💂‍♂️', '💂‍♀️', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👨‍🍼', '👩‍🍼', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👦', '👨‍👧', '👩‍👦', '👩‍👧', '🗣️', '👤', '👥', '🫂', '🧑‍🤝‍🧑', '👪', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '🩸', '🧬', '🦠', '🧫', '🧪', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰', '🪙', '💴', '💶', '💷', '💸', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲']
  },
  {
    name: 'Ferramentas',
    icons: ['🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰', '🪙', '💴', '💶', '💷', '💸', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲']
  },
  {
    name: 'Bandeiras',
    icons: ['🏳️', '🏴', '🏁', '🚩', '🎌', '🏴‍☠️', '🇦🇫', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨', '🇨🇻', '🇰🇾', '🇨🇫', '🇹🇩', '🇨🇱', '🇨🇳', '🇨🇽', '🇨🇨', '🇨🇴', '🇰🇲', '🇨🇬', '🇨🇩', '🇨🇰', '🇨🇷', '🇭🇷', '🇨🇺', '🇨🇼', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇯', '🇩🇲', '🇩🇴', '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇸🇿', '🇪🇹', '🇪🇺', '🇫🇰', '🇫🇴', '🇫🇯', '🇫🇮', '🇫🇷', '🇬🇫', '🇵🇫', '🇹🇫', '🇬🇦', '🇬🇲', '🇬🇪', '🇩🇪', '🇬🇭', '🇬🇮', '🇬🇷', '🇬🇱', '🇬🇩', '🇬🇵', '🇬🇺', '🇬🇹', '🇬🇬', '🇬🇳', '🇬🇼', '🇬🇾', '🇭🇹', '🇭🇳', '🇭🇰', '🇭🇺', '🇮🇸', '🇮🇳', '🇮🇩', '🇮🇷', '🇮🇶', '🇮🇪', '🇮🇲', '🇮🇱', '🇮🇹', '🇨🇮', '🇯🇲', '🇯🇵', '🇯🇪', '🇯🇴', '🇰🇿', '🇰🇪', '🇰🇮', '🇽🇰', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇻', '🇱🇧', '🇱🇸', '🇱🇷', '🇱🇮', '🇱🇹', '🇱🇺', '🇲🇴', '🇲🇬', '🇲🇼', '🇲🇾', '🇲🇻', '🇲🇱', '🇲🇹', '🇲🇭', '🇲🇶', '🇲🇷', '🇲🇺', '🇾🇹', '🇲🇽', '🇫🇲', '🇲🇩', '🇲🇨', '🇲🇳', '🇲🇪', '🇲🇸', '🇲🇦', '🇲🇿', '🇲🇲', '🇳🇦', '🇳🇷', '🇳🇵', '🇳🇱', '🇳🇨', '🇳🇿', '🇳🇮', '🇳🇪', '🇳🇬', '🇳🇺', '🇳🇫', '🇲🇵', '🇰🇵', '🇳🇴', '🇴🇲', '🇵🇰', '🇵🇼', '🇵🇸', '🇵🇦', '🇵🇬', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇳', '🇵🇱', '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇺', '🇷🇼', '🇧🇱', '🇸🇭', '🇰🇳', '🇱🇨', '🇵🇲', '🇻🇨', '🇸🇩', '🇸🇷', '🇸🇰', '🇸🇮', '🇸🇧', '🇸🇴', '🇿🇦', '🇬🇸', '🇰🇷', '🇸🇸', '🇪🇸', '🇱🇰', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇼', '🇹🇯', '🇹🇿', '🇹🇭', '🇹🇱', '🇹🇬', '🇹🇰', '🇹🇴', '🇹🇹', '🇹🇳', '🇹🇷', '🇹🇲', '🇹🇨', '🇻🇮', '🇹🇻', '🇺🇬', '🇺🇦', '🇦🇪', '🇬🇧', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇺', '🇻🇦', '🇻🇪', '🇻🇳', '🇼🇫', '🇪🇭', '🇾🇪', '🇿🇲', '🇿🇼']
  }
];

const iconOptions = iconCategories.flatMap(category => category.icons);

const CRMSettingsModal: React.FC<CRMSettingsModalProps> = ({ isOpen, onClose, columns, onSave, classifications, onClassificationsChange, canCustomize = false }) => {
  const [editableColumns, setEditableColumns] = useState<CrmColumnSettings[]>([]);
  const [editableClassifications, setEditableClassifications] = useState<Classification[]>([]);
  const [newClassificationText, setNewClassificationText] = useState('');
  const [newClassificationIcon, setNewClassificationIcon] = useState('⭐');

  const [isExiting, setIsExiting] = useState(false);
  const [openIconPicker, setOpenIconPicker] = useState<number | null>(null);
  const [openTagIconPicker, setOpenTagIconPicker] = useState<number | null>(null);
  const [openClassificationIconPicker, setOpenClassificationIconPicker] = useState<number | 'new' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Emoções');


  useEffect(() => {
    if (isOpen) {
      setEditableColumns(JSON.parse(JSON.stringify(columns)));
      setEditableClassifications(JSON.parse(JSON.stringify(classifications)));
      setNewClassificationText('');
      setNewClassificationIcon('⭐');
    } else {
      setOpenIconPicker(null);
      setOpenClassificationIconPicker(null);
      setOpenTagIconPicker(null);
    }
  }, [isOpen, columns, classifications]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleFieldChange = (index: number, field: keyof CrmColumnSettings, value: any) => {
    const newColumns = [...editableColumns];
    (newColumns[index] as any)[field] = value;
    setEditableColumns(newColumns);
  };

  const handleAiRuleChange = (index: number, value: string) => {
    const newColumns = [...editableColumns];
    if (newColumns[index].ai_actions && newColumns[index].ai_actions!.length > 0) {
      newColumns[index].ai_actions![0].description = value;
      setEditableColumns(newColumns);
    }
  };

  const handleAddColumn = () => {
    const newColumn: CrmColumnSettings = {
      id: `custom-${Date.now()}`,
      title: 'Nova Coluna',
      icon: '🆕',
      tagIcon: '🆕',
      tagTitle: 'Nova Tag',
      visible: true,
      deletable: true,
    };
    setEditableColumns([...editableColumns, newColumn]);
  };

  const handleDeleteColumn = (index: number) => {
    setEditableColumns(editableColumns.filter((_, i) => i !== index));
  };

  const handleAddClassification = () => {
    if (newClassificationText.trim() && !editableClassifications.some(c => c.text === newClassificationText.trim())) {
      setEditableClassifications([...editableClassifications, { text: newClassificationText.trim(), icon: newClassificationIcon }]);
      setNewClassificationText('');
      setNewClassificationIcon('⭐');
    }
  };

  const handleEditClassification = (index: number, field: 'text' | 'icon', value: string) => {
    const updatedClassifications = [...editableClassifications];
    updatedClassifications[index][field] = value;
    setEditableClassifications(updatedClassifications);
  };

  const handleDeleteClassification = (index: number) => {
    setEditableClassifications(editableClassifications.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(editableColumns);
    onClassificationsChange(editableClassifications);
    handleClose();
  };

  if (!isOpen && !isExiting) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-2xl ${isOpen && !isExiting ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-secondary">Configurar Colunas e Classificações do CRM</h3>

          <div className="mt-6 max-h-[60vh] overflow-y-auto pr-4">
            {/* Columns Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Colunas do Funil</h4>
              <p className="text-sm text-gray-500 mb-4">Adicione, edite ou remova colunas da sua visualização do CRM.</p>
              <div className="space-y-4">
                {editableColumns.map((col, index) => (
                  <div key={col.id} className="bg-light p-4 rounded-xl space-y-4 border border-gray-100 shadow-sm">
                    {/* Linha 1: Ícone da Coluna e Nome da Coluna */}
                    <div className="flex items-end gap-3">
                      <div className="relative w-14">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Ícone</div>
                        <button
                          type="button"
                          onClick={() => { setOpenIconPicker(openIconPicker === index ? null : index); setOpenTagIconPicker(null); }}
                          className="w-full h-11 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-xl bg-white hover:border-primary transition-colors"
                        >
                          {col.icon}
                        </button>
                        {openIconPicker === index && (
                          <div className="absolute z-20 mt-1 w-64 bg-white shadow-xl rounded-lg border border-gray-200 left-0">
                            <div className="p-2 border-b border-gray-100 flex flex-wrap gap-1">
                              {iconCategories.map(category => (
                                <button
                                  key={category.name}
                                  type="button"
                                  onClick={() => setSelectedCategory(category.name)}
                                  className={`px-2 py-1 text-[10px] rounded-md transition-colors ${selectedCategory === category.name ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                  {category.name}
                                </button>
                              ))}
                            </div>
                            <div className="grid grid-cols-5 gap-1 p-2 max-h-48 overflow-y-auto">
                              {iconCategories.find(cat => cat.name === selectedCategory)?.icons.map(icon => (
                                <button key={icon} type="button" onClick={() => { handleFieldChange(index, 'icon', icon); setOpenIconPicker(null); }} className="p-1.5 rounded-md hover:bg-gray-100 text-xl transition-transform hover:scale-110">
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Nome da Coluna (Funil)</div>
                        <input
                          type="text"
                          value={col.title}
                          onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                          className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                          placeholder="Ex: Novos Clientes"
                        />
                      </div>
                      <div className="flex items-center gap-2 pb-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={col.visible} onChange={(e) => handleFieldChange(index, 'visible', e.target.checked)} />
                          <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          <span className="ml-2 text-[11px] font-bold text-gray-500 uppercase tracking-tight">Visível</span>
                        </label>
                      </div>
                      <div className="pb-1.5 px-1">
                        {canCustomize && col.deletable && (
                          <button onClick={() => handleDeleteColumn(index)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label="Excluir coluna">
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Linha 2: Ícone da Tag e Nome da Tag */}
                    <div className="flex items-end gap-3 pl-4 border-l-2 border-primary/20 bg-primary/5 p-3 rounded-r-lg">
                      <div className="relative w-14">
                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 leading-tight">Ícone Tag</div>
                        <button
                          type="button"
                          onClick={() => { setOpenTagIconPicker(openTagIconPicker === index ? null : index); setOpenIconPicker(null); }}
                          className="w-full h-11 flex items-center justify-center border border-primary/30 rounded-lg shadow-sm text-xl bg-white hover:border-primary transition-colors"
                        >
                          {col.tagIcon || col.icon}
                        </button>
                        {openTagIconPicker === index && (
                          <div className="absolute z-20 mt-1 w-64 bg-white shadow-xl rounded-lg border border-gray-200 left-0">
                            <div className="p-2 border-b border-gray-100 flex flex-wrap gap-1">
                              {iconCategories.map(category => (
                                <button
                                  key={category.name}
                                  type="button"
                                  onClick={() => setSelectedCategory(category.name)}
                                  className={`px-2 py-1 text-[10px] rounded-md transition-colors ${selectedCategory === category.name ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                  {category.name}
                                </button>
                              ))}
                            </div>
                            <div className="grid grid-cols-5 gap-1 p-2 max-h-48 overflow-y-auto">
                              {iconCategories.find(cat => cat.name === selectedCategory)?.icons.map(icon => (
                                <button key={icon} type="button" onClick={() => { handleFieldChange(index, 'tagIcon', icon); setOpenTagIconPicker(null); }} className="p-1.5 rounded-md hover:bg-gray-100 text-xl transition-transform hover:scale-110">
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 leading-tight">Nome da Tag (Exibido no Cliente)</div>
                        <input
                          type="text"
                          value={col.tagTitle || col.title}
                          onChange={(e) => handleFieldChange(index, 'tagTitle', e.target.value)}
                          className="w-full h-11 px-3 py-2 border border-primary/30 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                          placeholder="Ex: Novo Cliente"
                        />
                      </div>
                    </div>

                    {/* Regra de IA */}
                    <div className="bg-white/50 p-3 rounded-lg border border-gray-100">
                      {col.ai_actions && col.ai_actions.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Regra de IA (Prompt)</label>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${col.ai_actions[0].active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                              {col.ai_actions[0].active ? 'Automação Ativa' : 'Automação Pausada'}
                            </span>
                          </div>
                          <textarea
                            value={col.ai_actions[0].description}
                            onChange={(e) => handleAiRuleChange(index, e.target.value)}
                            rows={3}
                            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Descreva a regra para a IA..."
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Descrição (Resumo)</label>
                          <textarea
                            value={col.description || ''}
                            onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Descrição da etapa..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {canCustomize && (
                <div className="mt-6">
                  <button onClick={handleAddColumn} className="w-full py-2 px-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors">
                    + Coluna
                  </button>
                </div>
              )}
            </div>

            {/* Classifications Section */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-lg font-semibold text-gray-800">Gerenciar Classificações (Tags)</h4>
              <p className="text-sm text-gray-500 mb-4">Crie, edite ou remova tags com ícones para classificar seus clientes.</p>

              <div className="flex gap-2 mb-4">
                <div className="relative">
                  <button type="button" onClick={() => setOpenClassificationIconPicker(openClassificationIconPicker === 'new' ? null : 'new')} className="p-2 border border-gray-300 rounded-md shadow-sm text-lg bg-white h-full" aria-haspopup="true">
                    {newClassificationIcon}
                  </button>
                  {openClassificationIconPicker === 'new' && (
                    <div className="absolute z-10 mt-1 w-64 bg-white shadow-lg rounded-md border border-gray-200">
                      <div className="border-b border-gray-200">
                        <div className="flex flex-wrap gap-1 p-2">
                          {iconCategories.map(category => (
                            <button
                              key={category.name}
                              type="button"
                              onClick={() => setSelectedCategory(category.name)}
                              className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedCategory === category.name
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1 p-2 max-h-48 overflow-y-auto">
                        {iconCategories
                          .find(cat => cat.name === selectedCategory)
                          ?.icons.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => {
                                setNewClassificationIcon(icon);
                                setOpenClassificationIconPicker(null);
                              }}
                              className="p-1 rounded-md hover:bg-gray-100 text-lg"
                            >
                              {icon}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <input type="text" value={newClassificationText} onChange={(e) => setNewClassificationText(e.target.value)} placeholder="Ex: Cliente VIP" className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm" />
                {canCustomize && (
                  <button type="button" onClick={handleAddClassification} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">
                    Adicionar Tag
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {editableClassifications.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    <div className="relative">
                      <button type="button" onClick={() => setOpenClassificationIconPicker(openClassificationIconPicker === index ? null : index)} className="p-2 border border-gray-300 rounded-md shadow-sm text-lg bg-white h-full" aria-haspopup="true">
                        {tag.icon}
                      </button>
                      {openClassificationIconPicker === index && (
                        <div className="absolute z-10 mt-1 w-64 bg-white shadow-lg rounded-md border border-gray-200">
                          <div className="border-b border-gray-200">
                            <div className="flex flex-wrap gap-1 p-2">
                              {iconCategories.map(category => (
                                <button
                                  key={category.name}
                                  type="button"
                                  onClick={() => setSelectedCategory(category.name)}
                                  className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedCategory === category.name
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                  {category.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-1 p-2 max-h-48 overflow-y-auto">
                            {iconCategories
                              .find(cat => cat.name === selectedCategory)
                              ?.icons.map(icon => (
                                <button
                                  key={icon}
                                  type="button"
                                  onClick={() => {
                                    handleEditClassification(index, 'icon', icon);
                                    setOpenClassificationIconPicker(null);
                                  }}
                                  className="p-1 rounded-md hover:bg-gray-100 text-lg"
                                >
                                  {icon}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input type="text" value={tag.text} onChange={(e) => handleEditClassification(index, 'text', e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm" />
                    {canCustomize && (
                      <button onClick={() => handleDeleteClassification(index)} className="p-2 rounded-md text-red-500 hover:bg-red-100" aria-label="Excluir classificação">
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
          <button type="button" onClick={handleSave} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark sm:ml-3 sm:w-auto sm:text-sm">
            Salvar Alterações
          </button>
          <button type="button" onClick={handleClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMSettingsModal;
