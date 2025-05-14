const apiKey = "AIzaSyDGn0h1_hQl1tegCY9nzyn4FTxuip7hc4s";
const systemPrompt = "Giới thiệu và xin chào: Xin chào tôi là chatbot AI được triển khai bởi NLDK. Bạn cần tôi hỗ trợ gì về tài liệu học tập, hay cần liên hệ với NLDK hoặc điều gì khác. Tôi là AI chia sẻ tài liệu ôn thi cho sinh viên HUIT";

let conversationHistory = [
   { role: "user", parts: [{ text: systemPrompt }] }
];

function escapeHTML(str) {
   return str.replace(/[&<>"']/g, function (m) {
      return {
         '&': '&amp;',
         '<': '&lt;',
         '>': '&gt;',
         '"': '&quot;',
         "'": '&#39;'
      }[m];
   });
}

async function sendMessage() {
   const input = document.getElementById("user-input");
   const message = input.value.trim();
   if (!message) return;

   displayMessage(message, "user");
   input.value = "";

   const botMessageElement = displayMessage("Bot đang trả lời...", "ai", true);

   const userMessageLower = message.toLowerCase();
   const localAnswer = await searchLocalData(userMessageLower);

   let promptText = "";

   if (localAnswer) {
      promptText =
         `Người dùng hỏi: "${message}".\n` +
         `Dưới đây là nội dung :\n"${localAnswer.answer}" và hãy chỉnh câu trả lời sinh động. không gửi nhiều 1 lần đường dẫn https  `;
   } else {
      promptText = message;
   }

   conversationHistory.push({ role: "user", parts: [{ text: promptText }] });
   const reply = await sendMessageToGemini(conversationHistory);
   conversationHistory.push({ role: "model", parts: [{ text: reply }] });
   replaceMessage(botMessageElement, reply);
}

function displayMessage(msg, sender, isTemporary = false) {
   const chatBox = document.getElementById("chat-box");

   let escaped = escapeHTML(msg);
   escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
   escaped = escaped.replace(/\s\*\s/g, "<br>");

   const div = document.createElement("p");
   div.className = `message ${sender}`;
   div.innerHTML = escaped;

   if (isTemporary) {
      div.classList.add("temporary");
   }

   chatBox.appendChild(div);
   chatBox.scrollTop = chatBox.scrollHeight;
   return div;
}

function replaceMessage(oldMessageElement, newMessage) {
   const chatBox = document.getElementById("chat-box");

   let escaped = escapeHTML(newMessage);
   escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
   escaped = escaped.replace(/\s\*\s/g, "<br>");
   escaped = escaped.replace(/^(\d+\.\s)/gm, "<br>$1");

   const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
   escaped = escaped.replace(urlPattern, function(url) {
      return `<a href="${url}" target="_blank">${url}</a>`;
   });

   const newMessageElement = document.createElement("p");
   newMessageElement.className = "message ai";
   newMessageElement.innerHTML = escaped;

   chatBox.replaceChild(newMessageElement, oldMessageElement);
   chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessageToGemini(conversation) {
   try {
      const response = await fetch(
         `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
         {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: conversation })
         }
      );

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return reply || "Không có phản hồi.";
   } catch (err) {
      console.error("Lỗi gọi API:", err);
      return "Đã xảy ra lỗi khi gọi Gemini API.";
   }
}

async function searchLocalData(question) {
   try {
      const res = await fetch("https://raw.githubusercontent.com/nguyenledangkhoaa/ai/main/data.json");
      const text = await res.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
         const data = JSON.parse(line);

         const keywords = data.keyword;
         for (const kw of keywords) {
            if (question.toLowerCase().includes(kw.toLowerCase())) {
               return { answer: data.answer, subject: data.category };
            }
         }
      }
      return null;
   } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      return null;
   }
}

document.addEventListener('keydown', function (e) {
   if (
      e.key === 'F12' || 
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'U')
   ) {
      e.preventDefault();
      alert("Tính năng này đã bị vô hiệu hóa.");
   }
});
