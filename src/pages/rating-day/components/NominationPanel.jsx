import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';

const NominationPanel = ({ nominations, onSubmit, onSupport, isAuthenticated, sport }) => {
  const [showForm, setShowForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(playerName.trim(), reason.trim());
      setPlayerName('');
      setReason('');
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to submit nomination');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Icon name="UserPlus" size={20} className="text-amber-500" />
          Nominations
        </h3>
        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            iconName={showForm ? 'X' : 'Plus'}
          >
            {showForm ? 'Cancel' : 'Nominate'}
          </Button>
        )}
      </div>

      {/* Nomination form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="mb-4 space-y-3 overflow-hidden"
          >
            <Input
              label="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Zinedine Zidane"
              required
            />
            <Input
              label="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why should they be in the Top 100?"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" loading={submitting} fullWidth>
              Submit Nomination
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Nominations list */}
      <div className="space-y-2">
        {nominations.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No nominations yet for {sport}
          </p>
        ) : (
          nominations.map((nom) => (
            <div
              key={nom.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{nom.playerName}</div>
                {nom.reason && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{nom.reason}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    nom.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    nom.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    nom.status === 'EVALUATING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  }`}>
                    {nom.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-sm font-medium text-slate-400">
                  {nom.supportVotes}
                </span>
                {isAuthenticated && nom.status === 'PENDING' && (
                  <button
                    onClick={() => onSupport(nom.id)}
                    className="p-1.5 rounded-lg hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition-colors"
                    title="Support this nomination"
                  >
                    <Icon name="ThumbsUp" size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-slate-400 mt-3">
        Nominations with 5+ support votes are evaluated by AI for entry into the Top 100.
      </p>
    </div>
  );
};

export default NominationPanel;
