import { FC, useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from '@heroui/react';
import { Key, Eye, EyeOff, ExternalLink, Check, Trash2, ShieldCheck } from 'lucide-react';
import { getGroqApiKey, setGroqApiKey, clearGroqApiKey, getApiKeySource } from '../services/apiKey';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (key: string) => void;
}

export const ApiKeyModal: FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const source = getApiKeySource();

  useEffect(() => {
    if (isOpen) {
      setApiKey(getGroqApiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    setGroqApiKey(apiKey.trim());
    setSavedSuccess(true);
    if (onKeySaved) onKeySaved(apiKey.trim());
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    clearGroqApiKey();
    setApiKey('');
    setSavedSuccess(false);
    if (onKeySaved) onKeySaved('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      placement="center"
      classNames={{
        base: 'bg-white rounded-[16px] border border-[#EDEDED] shadow-2xl max-w-lg',
        header: 'border-b border-[#F0F0F0] pb-3',
        footer: 'border-t border-[#F0F0F0] pt-3',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-50 text-[#E31B23]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">
                  Cấu hình Groq Cloud API Key
                </h3>
                <p className="text-xs text-[#757575] font-normal">
                  Mô hình Llama 3.3 70B Versatile sinh kịch bản siêu tốc (~300 tokens/s)
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="py-4 flex flex-col gap-3.5">
              {/* Key source status banner */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F6F8] border border-gray-200 text-xs">
                <span className="text-[#5A5A5A] flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#E31B23]" />
                  Nguồn API Key hiện tại:
                </span>
                <span className="font-bold text-[#1A1A1A]">
                  {source === 'env'
                    ? '📁 Biến môi trường (.env.local)'
                    : source === 'local'
                    ? '💾 Bộ nhớ trình duyệt (localStorage)'
                    : '⚠️ Chưa cấu hình'}
                </span>
              </div>

              {/* Input Key */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Nhập Groq API Key (<code className="font-mono text-[#E31B23]">gsk_...</code>):
                </label>
                <Input
                  value={apiKey}
                  onValueChange={setApiKey}
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  type={isVisible ? 'text' : 'password'}
                  variant="bordered"
                  classNames={{
                    inputWrapper: 'border-[#EDEDED] focus-within:!border-[#E31B23] h-11',
                    input: 'font-mono text-xs text-[#1A1A1A]',
                  }}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {isVisible ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
              </div>

              {/* Free Groq Key Guide */}
              <div className="text-[11px] text-[#757575] leading-relaxed flex items-center justify-between">
                <span>Chưa có key? Nhận khóa miễn phí ngay lập tức tại:</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#E31B23] hover:underline inline-flex items-center gap-1"
                >
                  Groq Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </ModalBody>

            <ModalFooter className="flex items-center justify-between">
              <div>
                {source === 'local' && (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onClick={handleClear}
                    startContent={<Trash2 className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Xóa Key đã lưu
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="flat" onClick={onClose} className="text-xs">
                  Đóng
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onClick={handleSave}
                  disabled={!apiKey.trim()}
                  startContent={savedSuccess ? <Check className="w-3.5 h-3.5" /> : undefined}
                  className="bg-gradient-to-r from-[#D91820] to-[#F23841] text-white font-bold text-xs shadow-md"
                >
                  {savedSuccess ? 'Đã lưu!' : 'Lưu API Key'}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
