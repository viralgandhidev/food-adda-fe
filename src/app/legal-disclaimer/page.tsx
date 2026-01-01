"use client";

import MainLayout from "@/components/layout/MainLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const disclaimerContent = `**Legal Disclaimer for blogs**

**1. General Information**  
The information provided on (this "Blog") is for general informational and educational purposes only. All content, including recipes, nutrition advice, and health-related information, is based on personal experience, research, and opinions. It should not be considered professional medical, legal, or nutritional advice.

**2. No Professional Advice**  
The Blog does not provide medical, health, or dietary advice. The content is not a substitute for professional consultation with a doctor, nutritionist, or dietitian. Always consult a qualified professional before making dietary changes, especially if you have any medical conditions, allergies, or dietary restrictions.

**3. Food Safety & Allergies**  
While we strive to provide accurate ingredient lists and preparation methods, we cannot guarantee that the recipes are free from allergens such as nuts, dairy, gluten, or other ingredients that may cause allergic reactions. Please use your discretion and consult ingredient labels before consumption.

**4. Accuracy of Information**  
We make every effort to ensure the information on the Blog is accurate and up to date. However, we do not guarantee its completeness, reliability, or accuracy. Ingredient availability, nutrition facts, and cooking methods may vary. We are not responsible for errors or omissions.

**5. External Links & Third-Party Content**  
The Blog may contain links to external websites for additional resources or affiliate products. We do not endorse or take responsibility for the content, policies, or services of third-party sites. Any reliance on external content is at your own risk.

**6. Limitation of Liability**  
[**foodadda.in blogs section**] and its authors are not liable for any direct, indirect, incidental, or consequential damages that may result from using the information or recipes on this Blog. This includes, but is not limited to, foodborne illnesses, allergic reactions, or any adverse effects from following our content.

**7. Copyright & Intellectual Property**  
All text, images, and content on this Blog are the property of [foodadda.in] unless otherwise stated. Unauthorized use, reproduction, or distribution of our content without prior written permission is prohibited.

**8. Changes to Disclaimer**  
We reserve the right to modify or update this disclaimer at any time without prior notice. By continuing to use the Blog, you acknowledge and accept any changes made.

**9. Contact Information**  
For any questions regarding this disclaimer, please contact us at [info@foodadda.in].`;

export default function LegalDisclaimerPage() {
  return (
    <MainLayout>
      <section className="max-w-[1000px] mx-auto px-6 md:px-8 py-12">
        <h1 className="text-3xl font-extrabold text-[#181818] mb-6">
          Legal Disclaimer for Blogs
        </h1>

        <div className="max-w-none break-words whitespace-pre-wrap">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-3xl md:text-4xl font-extrabold text-[#181818] mt-6 mb-4"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-2xl font-extrabold text-[#181818] mt-6 mb-3"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl font-bold text-[#181818] mt-5 mb-2" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p
                  className="text-[15px] leading-7 text-gray-700 my-3"
                  {...props}
                />
              ),
              strong: ({ node, ...props }) => (
                <strong className="text-[#181818] font-semibold" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic" {...props} />
              ),
              a: ({ node, ...props }) => (
                <a
                  className="text-[#F4D300] underline"
                  target="_blank"
                  rel="noreferrer"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-6 my-3 space-y-2" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-6 my-3 space-y-2" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="leading-7 text-gray-700" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-gray-200 pl-4 text-gray-600 italic my-4"
                  {...props}
                />
              ),
            }}
          >
            {disclaimerContent}
          </ReactMarkdown>
        </div>
      </section>
    </MainLayout>
  );
}

