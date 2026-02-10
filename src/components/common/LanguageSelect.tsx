
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';

export default function LanguageSelect() {
    const { i18n } = useTranslation();

    return (
        <Select
            size="large"
            value={i18n.language.split('-')[0]}
            onChange={(lng: string) => i18n.changeLanguage(lng)}
            style={{ width: 100 }}
            options={[{ value: 'zh', label: '中文' }, { value: 'vi', label: 'VN' }, { value: 'th', label: 'TH' }, { value: 'mm', label: 'MM' }]}
        />
    );
}
