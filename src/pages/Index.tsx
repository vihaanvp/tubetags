import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const Index = () => {
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalCharCount, setTotalCharCount] = useState(0);
  const {
    toast
  } = useToast();
  const handleGenerate = async () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a video title or description",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("generate-tags", {
        body: {
          input: input.trim()
        }
      });
      if (error) throw error;
      const generatedTags = data.tags || [];
      const charCount = generatedTags.join(", ").length;
      setTags(generatedTags);
      setTotalCharCount(charCount);
      toast({
        title: "Tags generated!",
        description: `Generated ${generatedTags.length} tags (${charCount} characters)`
      });
    } catch (error) {
      console.error("Error generating tags:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate tags. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const handleCopyAll = () => {
    const tagsString = tags.join(", ");
    navigator.clipboard.writeText(tagsString);
    toast({
      title: "Copied!",
      description: "All tags copied to clipboard"
    });
  };
  return <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5
    }} className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <motion.div initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          type: "spring",
          stiffness: 200,
          damping: 15
        }} className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            YouTube Tags Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered tags for better discoverability
          </p>
        </div>

        <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: 0.2
      }} className="backdrop-blur-xl bg-gradient-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
          <div className="space-y-6">
            <div>
              <label htmlFor="video-input" className="block text-sm font-medium mb-2">
                Video Title or Description
              </label>
              <Textarea id="video-input" placeholder="Enter your YouTube video title or short description..." value={input} onChange={e => setInput(e.target.value)} className="min-h-[120px] resize-none bg-background/50 border-border focus:border-primary transition-colors" disabled={isGenerating} />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || !input.trim()} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-xl transition-all shadow-glow hover:shadow-glow hover:scale-[1.02]">
              {isGenerating ? <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </> : <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Tags
                </>}
            </Button>

            <AnimatePresence mode="wait">
              {tags.length > 0 && <motion.div initial={{
              opacity: 0,
              height: 0
            }} animate={{
              opacity: 1,
              height: "auto"
            }} exit={{
              opacity: 0,
              height: 0
            }} transition={{
              duration: 0.3
            }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Tags</h3>
                    <Button onClick={handleCopyAll} variant="outline" size="sm" className="gap-2 hover:bg-primary/10 hover:border-primary transition-colors">
                      <Copy className="h-4 w-4" />
                      Copy All
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => <motion.span key={index} initial={{
                  opacity: 0,
                  scale: 0.8
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} transition={{
                  delay: index * 0.05
                }} className="px-4 py-2 bg-secondary/50 hover:bg-secondary border border-border rounded-full text-sm font-medium transition-all hover:scale-105 hover:border-primary/50 cursor-default">
                        {tag}
                      </motion.span>)}
                  </div>

                  <div className="text-sm text-muted-foreground text-right">
                    Total: {totalCharCount} / 500 characters
                  </div>
                </motion.div>}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.p initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.4
      }} className="text-center text-muted-foreground text-sm mt-6">
          Powered by AI • Made by VihaanVP        
        </motion.p>
      </motion.div>
    </div>;
};
export default Index;