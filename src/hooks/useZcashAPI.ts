import { supabase } from "@/integrations/supabase/client";

export interface Block {
  height: number;
  hash: string;
  version: number;
  merkle_root?: string;
  timestamp: string;
  nonce?: string;
  difficulty?: number;
  size?: number;
  tx_count: number;
}

export const useZcashAPI = () => {
  const getLatestBlocks = async (limit: number = 10): Promise<Block[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('zcash-api', {
        body: { action: 'getLatestBlocks', limit },
      });

      if (error) throw error;
      return data.blocks || [];
    } catch (error) {
      console.error('Error fetching latest blocks:', error);
      return [];
    }
  };

  const searchBlockchain = async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('zcash-api', {
        body: { action: 'search', query },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching blockchain:', error);
      throw error;
    }
  };

  return {
    getLatestBlocks,
    searchBlockchain,
  };
};
